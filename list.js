document.addEventListener("DOMContentLoaded", () => {
  const app = {
    allData: [],
    header: [],
    currentFilter: "",
    API_BASE: window.location.origin,
    lightboxImages: [],
    lightboxIndex: 0,

    init: function () {
      this.fetchData();
      this.addEventListeners();
    },

    fetchData: function () {
      fetch(`${this.API_BASE}/list`)
        .then((res) => res.json())
        .then((data) => {
          this.processData(data);
          this.renderCards();
        })
        .catch(() => {
          document.getElementById("cardContainer").innerHTML =
            "<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>";
        });
    },

    processData: function (data) {
      if (!data || data.length < 2) return;
      this.header = data[0];
      this.allData = data.slice(1);
      this.allData.sort((a, b) => {
        const parseDate = (str) => {
          if (!str) return 0;
          // รองรับ DD/MM/YYYY, hh:mm:ss
          const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4}), *(\d{2}):(\d{2}):(\d{2})$/);
          if (!match) return 0;
          const [, d, m, y, hh, mm, ss] = match;
          return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}`).getTime();
        };
        return parseDate(b[1]) - parseDate(a[1]);
      });
      // อัปเดตจำนวนรายการหลังจากโหลดข้อมูล
      this.updateFilterCount(this.allData.length);
    },

    renderCards: function () {
      const container = document.getElementById("cardContainer");
      container.innerHTML = "";

      // กรองข้อมูลตาม status
      const filteredData = this.filterCards();

      if (filteredData.length === 0) {
        container.innerHTML =
          "<p>ไม่พบข้อมูล" +
          (this.currentFilter ? ` สำหรับสถานะ "${this.currentFilter}"` : "") +
          "</p>";
        return;
      }

      filteredData.forEach((row) => {
        const id = row[0] || "-";
        const date = row[1] || "-";
        const desc = row[4] || "-";
        const status = row[6] || "-";
        const statusClass = (status || "").replace(/\s+/g, "-");
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="id">ID: ${id}</div>
          <div class="date">วันที่: ${date}</div>
          <div class="desc" style="font-family: Helvetica, sans-serif;"><font>รายละเอียด: ${desc}</font></div>
          <div class="status ${statusClass}">${status}</div>
        `;
        card.onclick = () => this.showDetailById(id);
        container.appendChild(card);
      });

      // อัปเดตจำนวนรายการที่แสดง
      this.updateFilterCount(filteredData.length);
    },

    filterCards: function () {
      if (!this.currentFilter) {
        return this.allData;
      }
      return this.allData.filter((row) => {
        const status = row[6] || "";
        return status === this.currentFilter;
      });
    },

    updateFilterCount: function (count) {
      const filterCount = document.getElementById("filterCount");
      const totalCount = this.allData.length;
      if (this.currentFilter) {
        filterCount.textContent = `แสดง ${count} รายการจากทั้งหมด ${totalCount} รายการ`;
      } else {
        filterCount.textContent = `แสดงทั้งหมด ${totalCount} รายการ`;
      }
    },

    extractImageUrl: function (cellValue) {
      if (!cellValue) return null;

      // ลบช่องว่างและอักขระพิเศษ
      const cleanValue = cellValue.trim();

      // ตรวจสอบ =IMAGE formula
      const match = cleanValue.match(/^=IMAGE\("(.+?)"\)/i);
      if (match) {
        return this.processGoogleDriveUrl(match[1].trim());
      }

      // ตรวจสอบ URL โดยตรง
      if (cleanValue.startsWith("http")) {
        return this.processGoogleDriveUrl(cleanValue);
      }

      // ตรวจสอบ Google Drive URL ที่อาจมีรูปแบบอื่
      if (cleanValue.includes("drive.google.com")) {
        return this.processGoogleDriveUrl(cleanValue);
      }

      return null;
    },

    processGoogleDriveUrl: function (url) {
      if (!url) return url;

      // แปลง Google Drive URL ให้เป็นรูปแบบที่สามารถเข้าถึงได้โดยตรง
      if (url.includes("drive.google.com/file/d/")) {
        const fileId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (fileId) {
          return `https://drive.google.com/uc?export=view&id=${fileId[1]}`;
        }
      }

      // ถ้าเป็น Google Drive sharing URL
      if (url.includes("drive.google.com/open?id=")) {
        const fileId = url.match(/id=([a-zA-Z0-9-_]+)/);
        if (fileId) {
          return `https://drive.google.com/uc?export=view&id=${fileId[1]}`;
        }
      }

      return url;
    },

    showDetailById: function (id) {
      const row = this.allData.find((r) => r[0] == id);
      if (!row) {
        alert("ไม่พบข้อมูล");
        return;
      }
      const modalContent = document.getElementById("modalContent");
      modalContent.innerHTML = "";
      // เก็บลิสต์รูปภาพสำหรับ lightbox
      this.lightboxImages = [];
      this.header.forEach((h, i) => {
        if (i >= 9 && i <= 13) {
          const imgUrl = this.extractImageUrl(row[i]);
          const rawValue = row[i] || "";
          if (imgUrl) {
            const cleanUrl = imgUrl.replace(/["')]+$/g, "");
            const proxyUrl = `${this.API_BASE}/image-proxy?url=` + encodeURIComponent(cleanUrl);
            let fileName = this.getFileNameFromUrl(cleanUrl);
            if (!fileName || fileName.length < 3 || fileName.startsWith('uc?export')) {
              fileName = 'ไฟล์แนบ';
            }
            // ใช้ Fancybox
            const div = document.createElement("div");
            div.className = "row";
            div.innerHTML = `
              <span class="label">${h}:</span>
              <span class="value">
                <a data-fancybox="gallery" href="${proxyUrl}" data-caption="${fileName}">
                  <img src="${proxyUrl}"
                       alt="รูปภาพ"
                       loading="lazy"
                       style="max-width:200px;max-height:200px;display:block;cursor:zoom-in;">
                </a>
              </span>
            `;
            modalContent.appendChild(div);
          } else if (rawValue) {
            // ถ้าไม่ใช่ URL ให้แสดงเป็นชื่อไฟล์และลิงก์ดาวน์โหลด (สมมติว่าไฟล์อยู่ใน /files/)
            const div = document.createElement("div");
            div.className = "row";
            div.innerHTML = `<span class="label">${h}:</span> <span class="value"><a href="/files/${encodeURIComponent(rawValue)}" target="_blank" rel="noopener" style="color:#2196f3;text-decoration:underline;">${rawValue}</a></span>`;
            modalContent.appendChild(div);
          } else {
            const div = document.createElement("div");
            div.className = "row";
            div.innerHTML = `<span class="label">${h}:</span> <span class="value">-</span>`;
            modalContent.appendChild(div);
          }
        } else if (
          i === 8 ||
          h === "หมายเหตุ" ||
          h.toLowerCase().includes("note")
        ) {
          const noteDiv = document.createElement("div");
          noteDiv.className = "row";
          noteDiv.innerHTML = `<span class="label">${h}:</span> <span class="value"><textarea id="noteInput" style="width:180px;min-height:48px;resize:vertical;font:400 13px Helvetica, sans-serif;">${row[i] || ""}</textarea></span>`;
          modalContent.appendChild(noteDiv);
        } else {
          const div = document.createElement("div");
          div.className = "row";
          div.innerHTML = `<span class="label">${h}:</span> <span class="value">${row[i] || "-"}</span>`;
          modalContent.appendChild(div);
        }
      });

      const statusOptions = ["New", "In Progress", "Resolved", "Closed"];
      const currentStatus = row[6] || "";
      const statusSelect = document.createElement("select");
      statusSelect.className = "status-select";
      statusOptions.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        if (opt === currentStatus) option.selected = true;
        statusSelect.appendChild(option);
      });

      const statusRow = document.createElement("div");
      statusRow.className = "row";
      statusRow.innerHTML = `<span class="label">สถานะ:</span> `;
      statusRow.appendChild(statusSelect);
      modalContent.appendChild(statusRow);

      const saveAllBtn = document.createElement("button");
      saveAllBtn.textContent = "บันทึก";
      saveAllBtn.className = "save-btn";
      saveAllBtn.style.marginBottom = "8px";
      saveAllBtn.onclick = () => {
        const note = document.getElementById("noteInput")
          ? document.getElementById("noteInput").value
          : "";
        fetch(`${this.API_BASE}/update-status-note`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: statusSelect.value, note }),
        })
          .then((res) => res.text())
          .then((msg) => {
            this.showToast(msg, true);
            this.closeModal();
            setTimeout(() => {
              this.fetchData();
            }, 1000);
          })
          .catch((err) => {
            this.showToast("เกิดข้อผิดพลาด: " + err, false);
          });
      };

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "ปิด";
      closeBtn.className = "close-btn-bottom";
      closeBtn.style.marginBottom = "8px";
      closeBtn.onclick = () => this.closeModal();

      const btnGroup = document.createElement("div");
      btnGroup.className = "btn-group-modal";
      btnGroup.appendChild(saveAllBtn);
      btnGroup.appendChild(closeBtn);
      modalContent.appendChild(btnGroup);

      document.getElementById("modalBg").classList.add("active");
    },

    closeModal: function () {
      document.getElementById("modalBg").classList.remove("active");
    },

    showToast: function (msg, success) {
      let toast = document.getElementById("toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.style.background = success ? "#4caf50" : "#f44336";
      toast.style.color = "#fff";
      toast.style.position = "fixed";
      toast.style.bottom = "30px";
      toast.style.left = "50%";
      toast.style.transform = "translateX(-50%)";
      toast.style.padding = "14px 28px";
      toast.style.borderRadius = "8px";
      toast.style.fontSize = "1.1em";
      toast.style.zIndex = 2000;
      toast.style.opacity = 1;
      setTimeout(() => {
        toast.style.opacity = 0;
      }, 2000);
    },

    openLightbox: function (imgUrl) {
      var bg = document.getElementById("lightboxBg");
      var img = document.getElementById("lightboxImg");
      img.src = imgUrl;
      bg.style.display = "flex";
      // แสดงปุ่ม prev/next ถ้ามีหลายภาพ
      const prevBtn = document.getElementById('lightboxPrev');
      const nextBtn = document.getElementById('lightboxNext');
      if (this.lightboxImages.length > 1) {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
      } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
      }
      // ตั้งค่า index ปัจจุบัน
      this.lightboxIndex = this.lightboxImages.indexOf(imgUrl);
    },

    closeLightbox: function() {
      document.getElementById('lightboxBg').style.display = 'none';
    },

    showPrevLightbox: function() {
      if (this.lightboxImages.length < 2) return;
      this.lightboxIndex = (this.lightboxIndex - 1 + this.lightboxImages.length) % this.lightboxImages.length;
      document.getElementById('lightboxImg').src = this.lightboxImages[this.lightboxIndex];
    },

    showNextLightbox: function() {
      if (this.lightboxImages.length < 2) return;
      this.lightboxIndex = (this.lightboxIndex + 1) % this.lightboxImages.length;
      document.getElementById('lightboxImg').src = this.lightboxImages[this.lightboxIndex];
    },

    addEventListeners: function () {
      // Filter event listener
      document.getElementById('statusFilter').addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.renderCards();
      });
      
      document.getElementById('modalBg').addEventListener('click', e => {
        if (e.target === e.currentTarget) this.closeModal();
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          this.closeModal();
          document.getElementById('lightboxBg').style.display = 'none';
        }
        // เลื่อนภาพด้วยลูกศรซ้ายขวา
        if (document.getElementById('lightboxBg').style.display === 'flex') {
          if (e.key === 'ArrowLeft') this.showPrevLightbox();
          if (e.key === 'ArrowRight') this.showNextLightbox();
        }
      });
      document.getElementById('lightboxBg').onclick = e => {
        if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
      };
      // เชื่อม event ปุ่ม prev/next/close
      document.getElementById('lightboxPrev').onclick = (e) => { e.stopPropagation(); this.showPrevLightbox(); };
      document.getElementById('lightboxNext').onclick = (e) => { e.stopPropagation(); this.showNextLightbox(); };
      document.getElementById('lightboxImg').onclick = (e) => { e.stopPropagation(); };
    },

    getFileNameFromUrl: function (url) {
      // ตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
      const isImage = /(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i.test(url) || url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
      if (isImage) {
        return url.split('/').pop();
      }
      return url.split('/').pop();
    },
  };

  window.app = app;
  app.init();
});
