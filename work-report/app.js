// AM Maintenance Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('maintenanceForm');
    const workDateInput = document.getElementById('workDate');
    const descriptionInput = document.getElementById('description');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const responseMessage = document.getElementById('responseMessage');
    const messageContent = document.getElementById('messageContent');

    // Set default date to today
    const today = new Date();
    const defaultDate = today.toISOString().split('T')[0];
    workDateInput.value = defaultDate;

    // API configuration from the provided curl command
    const API_CONFIG = {
        url: 'https://assistant.gss.com.tw/AMApi/AMMaintainWeb/InsertData/AMMaintainWeb',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer pIi9nPdt9q8BRoofTO3swcbD9tS9X7dGdbEVMGZq8vr5wy3HpHpSyOuLA1dRLUqjDaSGOCKgAIbP01X8yLXDQcjP2PEepU5PqCY0VoNu4sP_UBNeKPlzDJcjWdVzZHXCqR5LsVKl_V-f-aS9Y1ZscE61JZnM2v9ghnMEimsVYnQ_QWh9gY9ZBKrb57Sv1YM5gRcCGq18NxxRLv4Fr6hQO365Uqur_OC6c05mEilW8mHSohOzUZtRvgChVIXVSojD8IXQzeLbDYS90eWCSbNkcACHgKNgY_y5yYMmviZ650d41Q0k0_2th1IWFKfsM8dVNQJEq4rb1AnIJ9PHmhecX5c1hyGXblpZyTl0tMVSQOwR-Jte6kmIAl6mUEAV3eNA8bnA8o_h83mQlXbypQ30CZR75N-oEkC18mLqrppvCmuor6JckNEGO7Pd4O9wvmZuCltEojoCtNpBi1pMb8h87u5gMn8PthGWusRhD8km7h9a5jM-iEQ5YV5Q1Orlz0URx7Vz9cs2JfIOq6D0sThB30qeIxwDeEzDIqxtAh0rZiVCvfAgcQMRghiFio3fs87OJ35mi6RaQfwqS1bpUZqE6xsLHynhdAvUnIh3V9J6hOUw3E4ZcmAGpF8DjZVkWmX0',
            'accept-language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'origin': 'https://assistant.gss.com.tw',
            'priority': 'u=1, i',
            'referer': 'https://assistant.gss.com.tw/am/',
            'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        }
    };

    // Fixed payload structure
    const FIXED_PAYLOAD = {
        actNo: null,
        actTypeId: "Be",
        custNo: "GSS",
        caseContNo: "O202502047",
        prdPjtNo: "內部專案-2025020600007 - Vital  Casebridge產品計畫書_2025年",
        ttlHours: 8,
        isPrnToCust: "Be099",
        attachFileName: null,
        isAttachFile: "00200",
        isPrdOrPjt: "J",
        message: null,
        status: false,
        favoriteContOppId: "7016",
        suppDeptItems: "U236"
    };

    // Form validation
    function validateForm() {
        let isValid = true;
        clearErrors();

        // Validate date
        const dateValue = workDateInput.value;
        if (!dateValue) {
            showError('dateError', '請選擇工作日期');
            isValid = false;
        }

        // Validate description
        const descriptionValue = descriptionInput.value.trim();
        if (!descriptionValue) {
            showError('descriptionError', '請輸入工作描述');
            isValid = false;
        } else if (descriptionValue.length < 5) {
            showError('descriptionError', '工作描述至少需要5個字符');
            isValid = false;
        }

        return isValid;
    }

    // Show error message
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    // Clear all error messages
    function clearErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.classList.remove('show');
            element.textContent = '';
        });
    }

    // Format date for API
    function formatDateTime(date, timeStr) {
        return date + timeStr;
    }

    // Show loading state
    function setLoadingState(isLoading) {
        if (isLoading) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            loadingSpinner.classList.remove('hidden');
        } else {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            loadingSpinner.classList.add('hidden');
        }
    }

    // Show response message
    function showResponse(message, isSuccess) {
        responseMessage.classList.remove('hidden', 'success', 'error');
        responseMessage.classList.add(isSuccess ? 'success' : 'error');
        messageContent.textContent = message;
        
        // Scroll to response message
        responseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-hide success message after 5 seconds
        if (isSuccess) {
            setTimeout(() => {
                responseMessage.classList.add('hidden');
            }, 5000);
        }
    }

    // Hide response message
    function hideResponse() {
        responseMessage.classList.add('hidden');
    }

    // Submit form
    async function submitForm(event) {
        event.preventDefault();
        
        console.log('表單提交開始');
        console.log('日期值:', workDateInput.value);
        console.log('描述值:', descriptionInput.value);
        
        if (!validateForm()) {
            console.log('表單驗證失敗');
            return;
        }

        setLoadingState(true);
        hideResponse();

        try {
            const dateValue = workDateInput.value;
            const descriptionValue = descriptionInput.value.trim();

            // Create payload with user inputs
            const payload = {
                ...FIXED_PAYLOAD,
                sdateTime: formatDateTime(dateValue, 'T00:30:00.000Z'),
                edateTime: formatDateTime(dateValue, 'T09:30:00.000Z'),
                description: descriptionValue
            };

            console.log('提交數據:', payload);

            const response = await fetch(API_CONFIG.url, {
                method: 'POST',
                headers: API_CONFIG.headers,
                body: JSON.stringify(payload),
                mode: 'cors'
            });

            console.log('API 響應狀態:', response.status);

            if (response.ok) {
                const responseData = await response.json();
                console.log('API 響應:', responseData);
                showResponse('工作單提交成功！', true);
                
                // Reset form on success
                setTimeout(() => {
                    descriptionInput.value = '';
                    workDateInput.value = defaultDate;
                }, 2000);
                
            } else {
                const errorText = await response.text();
                console.error('API 錯誤:', response.status, errorText);
                showResponse(`提交失敗：HTTP ${response.status} - ${response.statusText}`, false);
            }

        } catch (error) {
            console.error('網絡錯誤:', error);
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                showResponse('網絡連接錯誤：請檢查您的網絡連接或聯繫系統管理員。注意：由於CORS政策，此演示可能無法直接連接到外部API。', false);
            } else {
                showResponse(`提交錯誤：${error.message}`, false);
            }
        } finally {
            setLoadingState(false);
        }
    }

    // Event listeners
    form.addEventListener('submit', submitForm);

    // Clear errors on input change
    workDateInput.addEventListener('change', function() {
        console.log('日期變更:', this.value);
        clearErrors();
    });

    workDateInput.addEventListener('input', function() {
        console.log('日期輸入:', this.value);
        clearErrors();
    });

    descriptionInput.addEventListener('input', function() {
        console.log('描述輸入:', this.value);
        clearErrors();
        
        // Auto-resize textarea
        this.style.height = 'auto';
        this.style.height = Math.max(100, this.scrollHeight) + 'px';
    });

    // Ensure form elements are properly initialized
    setTimeout(() => {
        console.log('表單初始化完成');
        console.log('日期欄位值:', workDateInput.value);
        console.log('描述欄位值:', descriptionInput.value);
        
        // Test form element accessibility
        workDateInput.focus();
        setTimeout(() => {
            descriptionInput.focus();
            setTimeout(() => {
                workDateInput.focus();
            }, 100);
        }, 100);
    }, 100);

    console.log('AM 維護工作單系統已初始化');
});