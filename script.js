document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const searchInput = document.getElementById('searchInput');
    const clearIcon = document.getElementById('clearIcon');
    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    
    body.setAttribute('data-theme', currentTheme);

    function toggleClearBtn() {
        if (searchInput.value.trim().length > 0) {
            clearIcon.classList.add('visible');
        } else {
            clearIcon.classList.remove('visible');
        }
    }

    searchInput.addEventListener('input', toggleClearBtn);

    clearIcon.addEventListener('click', () => {
        searchInput.value = '';
        toggleClearBtn();
        searchInput.focus();
    });

    const savedVid = localStorage.getItem('savedVid');
    if (savedVid) {
        searchInput.value = savedVid;
        toggleClearBtn();
    }

    themeToggle.addEventListener('click', () => {
        const theme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });

    const infoIcon = document.getElementById('infoIcon');
    const modalOverlay = document.getElementById('infoModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalIcon = document.getElementById('closeModalIcon');

    if (infoIcon) {
        infoIcon.addEventListener('click', () => { 
            modalOverlay.classList.add('active'); 
        });
    }

    const closeModal = () => {
        modalOverlay.classList.remove('active');
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (closeModalIcon) closeModalIcon.addEventListener('click', closeModal);

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    const searchButton = document.getElementById('searchButton');
    const resultContainer = document.getElementById('resultContainer');

    searchButton.addEventListener('click', async () => {
        const query = searchInput.value.trim();

        if (!query) {
            searchInput.parentElement.style.borderColor = '#ef4444';
            setTimeout(() => searchInput.parentElement.style.borderColor = 'var(--border-color)', 1000);
            return;
        }

        searchButton.classList.add('loading');
        searchButton.disabled = true;
        resultContainer.innerHTML = `
            <div class="empty-state">
                <p style="color: var(--accent-blue);">جاري الاتصال بقاعدة البيانات...</p>
            </div>
        `;

        try {
            localStorage.setItem('savedVid', query);
            
            const AUTH_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaS5heW5pcS5hcHAvdjMvYXBpL2F1dGgvbG9naW4iLCJpYXQiOjE3NjYwNTU5ODIsImV4cCI6MTc5NzU5MTk4MiwibmJmIjoxNzY2MDU1OTgyLCJqdGkiOiJaWE1nQlZDUzEwZHdlVkQ3Iiwic3ViIjoiMjAyNzU2NSIsInBydiI6ImUzYWNhMWNmYTM2ZmIxYTU2ODkwZGEwMWY3ZWVhNGU2NDY5YjUzODYiLCJwaG9uZV9udW1iZXIiOiIrOTY0NzgwMzQzNjE4MyIsImNpdGl6ZW5fbmFtZSI6bnVsbCwiY2l0aXplbl9uYXRpb25hbF9pZCI6bnVsbCwiY2l0aXplbl9waG9uZSI6Iis5NjQ3ODAzNDM2MTgzIiwiY2l0aXplbl9nZW5kZXIiOm51bGx9.u5sD6ROESvg0K-zAOzkUV886geizdqfcJdv49bIXD-I";
            const formData = new FormData();
            formData.append('vid', query);

            const response = await fetch('https://api.ayniq.app/v3/api/fines/query/vid', {
                method: 'POST',
                headers: {
                    'authorization': `Bearer ${AUTH_TOKEN}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.status === 200) {
                if (result.data && result.data.length > 0) {
                    renderResults(result.data);
                } else {
                    resultContainer.innerHTML = `
                        <div class="empty-state">
                            <h3 style="color: var(--color-green); margin-bottom: 10px;">لا توجد غرامات</h3>
                            <p>المركبة ذات السنوية (${query}) لا تملك أي مخالفات مسجلة.</p>
                        </div>
                    `;
                }
            } else {
                showError(`${result.message}`);
            }

        } catch (error) {
            showError("حدث خطأ في الاتصال، يرجى تفعيل إضافة كسر الـ CORS.");
        } finally {
            searchButton.classList.remove('loading');
            searchButton.disabled = false;
        }
    });

    function renderResults(fines) {
        let totalAmount = 0;
        fines.forEach(fine => { totalAmount += fine.finalAmount; });

        let htmlContent = `
            <div class="summary-grid">
                <div class="summary-box total-amount">
                    <div class="summary-label">المجموع الكلي</div>
                    <div class="summary-value">${totalAmount.toLocaleString('en-US')} <span style="font-size: 14px;">د.ع</span></div>
                </div>
                <div class="summary-box total-count">
                    <div class="summary-label">المخالفات</div>
                    <div class="summary-value">${fines.length.toLocaleString('en-US')}</div>
                </div>
            </div>
        `;

        fines.forEach(fine => {
            const dateObj = new Date(fine.dateOfOffence);
            const dateStr = dateObj.toLocaleDateString('en-GB'); 
            const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
            let timeStr = dateObj.toLocaleTimeString('en-US', timeOptions);
            timeStr = timeStr.replace(/AM/i, 'صباحاً').replace(/PM/i, 'مساءً');

            let badgesHtml = `<span class="badge-unpaid">غير مدفوعة</span>`;
            let amountHtml = `<span class="row-value amount">${fine.finalAmount.toLocaleString('en-US')} <span style="font-size: 14px;">د.ع</span></span>`;
            
            if (fine.doubled) {
                badgesHtml += `<span class="badge-doubled">مضاعفة</span>`;
                amountHtml = `
                    <span class="original-amount">${fine.amount.toLocaleString('en-US')} د.ع</span>
                    <span class="row-value amount" style="color: #f43f5e;">${fine.finalAmount.toLocaleString('en-US')} <span style="font-size: 14px;">د.ع</span></span>
                `;
            }

            htmlContent += `
                <div class="fine-card">
                    <div class="card-header">
                        <span class="ref-number">REF: ${fine.fineId}</span>
                        <div class="card-badges">
                            ${badgesHtml}
                        </div>
                    </div>
                    <div class="card-row">
                        <div class="row-icon icon-calendar">
                            <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/></svg>
                        </div>
                        <div class="row-content">
                            <span class="row-label">تاريخ ووقت المخالفة</span>
                            <span class="row-value">${dateStr} | ${timeStr}</span>
                        </div>
                    </div>
                    <div class="card-row">
                        <div class="row-icon icon-location">
                            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        </div>
                        <div class="row-content">
                            <span class="row-label">مكان المخالفة</span>
                            <span class="row-value">${fine.registrationPlace}</span>
                        </div>
                    </div>
                    <div class="card-row">
                        <div class="row-icon icon-info">
                            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        </div>
                        <div class="row-content">
                            <span class="row-label">سبب المخالفة</span>
                            <span class="row-value">${fine.violationType}</span>
                        </div>
                    </div>
                    <div class="card-row">
                        <div class="row-icon icon-money">
                            <svg viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                        </div>
                        <div class="row-content">
                            <span class="row-label">مبلغ الغرامة</span>
                            ${amountHtml}
                        </div>
                    </div>
                </div>
            `;
        });

        resultContainer.innerHTML = htmlContent;
    }

    function showError(message) {
        resultContainer.innerHTML = `
            <div class="empty-state" style="border-color: #ef4444; background: rgba(239, 68, 68, 0.05);">
                <p style="color: #ef4444; font-weight: bold; line-height: 1.6;">${message}</p>
            </div>
        `;
    }
});