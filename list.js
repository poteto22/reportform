document.addEventListener('DOMContentLoaded', () => {
  const app = {
    allData: [],
    header: [],

    init: function() {
      this.fetchData();
      this.addEventListeners();
    },

    fetchData: function() {
      fetch('http://localhost:3000/list')
        .then(res => res.json())
        .then(data => {
          this.processData(data);
          this.renderCards();
        })
        .catch(() => {
          document.getElementById('cardContainer').innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        });
    },

    processData: function(data) {
      if (!data || data.length < 2) return;
      this.header = data[0];
      this.allData = data.slice(1);
      this.allData.sort((a, b) => {
        const parseDate = str => {
          if (!str) return 0;
          const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:, *(\d{1,2}:\d{2}:\d{2}))?$/);
          if (!match) return 0;
          const [ , d, m, y, time ] = match;
          const day = d.padStart(2, '0');
          const month = m.padStart(2, '0');
          const t = time ? time : '00:00:00';
          return new Date(`${y}-${month}-${day}T${t}`).getTime();
        };
        return parseDate(b[1]) - parseDate(a[1]);
      });
    },

    renderCards: function() {
      const container = document.getElementById('cardContainer');
      container.innerHTML = '';
      if (this.allData.length === 0) {
        container.innerHTML = '<p>ไม่พบข้อมูล</p>';
        return;
      }
      this.allData.forEach(row => {
        const id = row[0] || '-';
        const date = row[1] || '-';
        const desc = row[4] || '-';
        const status = row[6] || '-';
        const statusClass = (status || '').replace(/\s+/g, '-');
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="id">ID: ${id}</div>
          <div class="date">วันที่: ${date}</div>
          <div class="desc">รายละเอียด: ${desc}</div>
          <div class="status ${statusClass}">${status}</div>
        `;
        card.onclick = () => this.showDetailById(id);
        container.appendChild(card);
      });
    },

    extractImageUrl: function(cellValue) {
      if (!cellValue) return null;
      const match = cellValue.match(/^=IMAGE\("(.+?)"\)/i);
      if (match) return match[1];
      if (cellValue.startsWith('http')) return cellValue;
      return null;
    },

    showDetailById: function(id) {
      const row = this.allData.find(r => r[0] == id);
      if (!row) {
        alert('ไม่พบข้อมูล');
        return;
      }
      const modalContent = document.getElementById('modalContent');
      modalContent.innerHTML = '';
      this.header.forEach((h, i) => {
        if (i >= 9 && i <= 13) {
          const imgUrl = this.extractImageUrl(row[i]);
          if (imgUrl) {
            const cleanUrl = imgUrl.replace(/["')]+$/g, '');
            const proxyUrl = 'http://localhost:3000/image-proxy?url=' + encodeURIComponent(cleanUrl);
            const div = document.createElement('div');
            div.className = 'row';
            div.innerHTML = `<span class="label">${h}:</span> <span class="value"><img src="${proxyUrl}" alt="รูปภาพ" loading="lazy" style="max-width:200px;max-height:200px;display:block;cursor:zoom-in;" onclick="app.openLightbox('${proxyUrl}')"></span>`;
            modalContent.appendChild(div);
          } else {
            const div = document.createElement('div');
            div.className = 'row';
            div.innerHTML = `<span class="label">${h}:</span> <span class="value">${row[i] || '-'}</span>`;
            modalContent.appendChild(div);
          }
        } else if (i === 8 || h === 'หมายเหตุ' || h.toLowerCase().includes('note')) {
          const noteDiv = document.createElement('div');
          noteDiv.className = 'row';
          noteDiv.innerHTML = `<span class="label">${h}:</span> <span class="value"><textarea id="noteInput" style="width:180px;min-height:48px;resize:vertical;">${row[i] || ''}</textarea></span>`;
          modalContent.appendChild(noteDiv);
        } else {
          const div = document.createElement('div');
          div.className = 'row';
          div.innerHTML = `<span class="label">${h}:</span> <span class="value">${row[i] || '-'}</span>`;
          modalContent.appendChild(div);
        }
      });

      const statusOptions = ['New', 'In Progress', 'Resolved', 'Closed'];
      const currentStatus = row[6] || '';
      const statusSelect = document.createElement('select');
      statusSelect.className = 'status-select';
      statusOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === currentStatus) option.selected = true;
        statusSelect.appendChild(option);
      });

      const statusRow = document.createElement('div');
      statusRow.className = 'row';
      statusRow.innerHTML = `<span class="label">สถานะ:</span> `;
      statusRow.appendChild(statusSelect);
      modalContent.appendChild(statusRow);

      const saveAllBtn = document.createElement('button');
      saveAllBtn.textContent = 'บันทึก';
      saveAllBtn.className = 'save-btn';
      saveAllBtn.style.marginBottom = '8px';
      saveAllBtn.onclick = () => {
        const note = document.getElementById('noteInput') ? document.getElementById('noteInput').value : '';
        fetch('http://localhost:3000/update-status-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: statusSelect.value, note })
        })
        .then(res => res.text())
        .then(msg => {
          this.showToast(msg, true);
          this.closeModal();
          setTimeout(() => location.reload(), 1000);
        })
        .catch(err => {
          this.showToast('เกิดข้อผิดพลาด: ' + err, false);
        });
      };

      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'ปิด';
      closeBtn.className = 'close-btn-bottom';
      closeBtn.onclick = () => this.closeModal();

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group-modal';
      btnGroup.appendChild(saveAllBtn);
      btnGroup.appendChild(closeBtn);
      modalContent.appendChild(btnGroup);

      document.getElementById('modalBg').classList.add('active');
    },

    closeModal: function() {
      document.getElementById('modalBg').classList.remove('active');
    },

    showToast: function(msg, success) {
      let toast = document.getElementById('toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.style.background = success ? '#4caf50' : '#f44336';
      toast.style.color = '#fff';
      toast.style.position = 'fixed';
      toast.style.bottom = '30px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.padding = '14px 28px';
      toast.style.borderRadius = '8px';
      toast.style.fontSize = '1.1em';
      toast.style.zIndex = 2000;
      toast.style.opacity = 1;
      setTimeout(() => { toast.style.opacity = 0; }, 2000);
    },

    openLightbox: function(imgUrl) {
      var bg = document.getElementById('lightboxBg');
      var img = document.getElementById('lightboxImg');
      img.src = imgUrl;
      bg.style.display = 'flex';
    },

    addEventListeners: function() {
      document.getElementById('modalBg').addEventListener('click', e => {
        if (e.target === e.currentTarget) this.closeModal();
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          this.closeModal();
          document.getElementById('lightboxBg').style.display = 'none';
        }
      });
      document.getElementById('lightboxBg').onclick = e => {
        if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
      };
    }
  };

  window.app = app;
  app.init();
});