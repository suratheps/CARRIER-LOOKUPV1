/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 1.0
*/

$(document).ready(function() {
    // Set current year in footer
    $('#currentYear').text(new Date().getFullYear());

    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();

    // Theme switching functionality
    $('#themeSwitch').click(function() {
        $('body').toggleClass('light-mode dark-mode');
        const isDarkMode = $('body').hasClass('dark-mode');
        $(this).html(isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>');
        
        // Update card appearances
        if (isDarkMode) {
            $('.card').addClass('dark-mode');
        } else {
            $('.card').removeClass('dark-mode');
        }
    });

    // Phone list input handling (both manual and file)
    function updatePhonePreview() {
        const activeTab = $('#phoneInputTabs .nav-link.active').attr('id');
        let phones = [];
        
        if (activeTab === 'manual-tab') {
            // Get phones from textarea
            const text = $('#phoneListText').val().trim();
            if (text) {
                phones = text.split('\n')
                    .map(phone => phone.trim())
                    .filter(phone => phone.length > 0);
            }
        } else {
            // Get phones from file (if any)
            const file = $('#phoneListFile')[0].files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const content = e.target.result;
                    phones = content.split('\n')
                        .map(phone => phone.trim())
                        .filter(phone => phone.length > 0);
                    
                    displayPhonePreview(phones);
                };
                reader.readAsText(file);
                return; // Exit early as file reading is async
            }
        }
        
        displayPhonePreview(phones);
    }

    function displayPhonePreview(phones) {
        // Validate phone numbers format
        const validPhones = [];
        const invalidPhones = [];
        
        phones.forEach(phone => {
            // Simple validation for demonstration
            if (phone.startsWith('+') && phone.length >= 10) {
                validPhones.push(phone);
            } else {
                invalidPhones.push(phone);
            }
        });
        
        // Update phone preview
        if (validPhones.length > 0) {
            $('#phonePreview').html(`
                <div class="text-success">Valid phones: ${validPhones.length}</div>
                <div>${validPhones.slice(0, 5).join('<br>')}</div>
                ${validPhones.length > 5 ? '<div>... and ' + (validPhones.length - 5) + ' more</div>' : ''}
                ${invalidPhones.length > 0 ? `<div class="text-danger mt-2">Invalid phones (will be skipped): ${invalidPhones.length}</div>` : ''}
            `);
        } else if (phones.length > 0) {
            $('#phonePreview').html('<div class="text-danger">No valid phone numbers found. Format should be +[country code][number] (e.g., +11231231234)</div>');
        } else {
            $('#phonePreview').html('No phone numbers loaded yet. Enter phone numbers manually or upload a file to see preview.');
        }
        
        // Enable start button if we have valid phones and other required fields
        updateStartButtonState(validPhones.length);
    }

    // Event listeners for phone input changes
    $('#phoneListText').on('input', function() {
        if ($('#manual-tab').hasClass('active')) {
            updatePhonePreview();
        }
    });

    $('#phoneListFile').change(function() {
        if ($('#file-tab').hasClass('active')) {
            updatePhonePreview();
        }
    });

    // Tab change event
    $('#phoneInputTabs button').click(function() {
        // Update preview when switching tabs
        setTimeout(updatePhonePreview, 100);
    });

    // Update start button state based on form validity
    function updateStartButtonState(validPhonesCount = 0) {
        const apiKey = $('#apiKey').val().trim();
        const country = $('#country').val();
        const proxyList = $('#proxyList').val().trim();
        const proxyType = $('#proxyType').val();
        
        const isValid = apiKey && country && proxyList && proxyType && validPhonesCount > 0;
        $('#startBtn').prop('disabled', !isValid);
    }

    // Form field change listeners
    $('#apiKey, #proxyList, #proxyAuth, #proxyType, #country').on('input change', function() {
        updateStartButtonState();
    });

    // Start processing
    $('#startBtn').click(function() {
        // Get all form values
        const apiKey = $('#apiKey').val().trim();
        const country = $('#country').val();
        const proxyList = $('#proxyList').val().trim().split('\n').map(p => p.trim()).filter(p => p);
        const proxyAuth = $('#proxyAuth').val().trim();
        const proxyType = $('#proxyType').val();
        
        // Get phone numbers based on active tab
        const activeTab = $('#phoneInputTabs .nav-link.active').attr('id');
        let phones = [];
        
        if (activeTab === 'manual-tab') {
            // Get phones from textarea
            const text = $('#phoneListText').val().trim();
            if (text) {
                phones = text.split('\n')
                    .map(phone => phone.trim())
                    .filter(phone => phone.length > 0 && phone.startsWith('+'));
            }
        } else {
            // Get phones from file
            const file = $('#phoneListFile')[0].files[0];
            if (!file) {
                alert('Please upload a file with phone numbers');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                phones = content.split('\n')
                    .map(phone => phone.trim())
                    .filter(phone => phone.length > 0 && phone.startsWith('+'));
                
                if (phones.length === 0) {
                    alert('No valid phone numbers found. Format should be +[country code][number] (e.g., +11231231234)');
                    return;
                }
                
                startProcessing(phones, apiKey, country, proxyList, proxyAuth, proxyType);
            };
            reader.readAsText(file);
            return; // Exit early as file reading is async
        }
        
        if (phones.length === 0) {
            alert('No valid phone numbers found. Format should be +[country code][number] (e.g., +11231231234)');
            return;
        }
        
        startProcessing(phones, apiKey, country, proxyList, proxyAuth, proxyType);
    });

    function startProcessing(phones, apiKey, country, proxyList, proxyAuth, proxyType) {
        // Show progress card
        $('#progressCard').removeClass('d-none');
        $('#processedCount').text(0);
        $('#totalCount').text(phones.length);
        $('#remainingCount').text(phones.length);
        $('#liveCount').text(0);
        $('#dieCount').text(0);
        $('.progress-bar').css('width', '0%').attr('aria-valuenow', 0);
        $('#progressPercent').text('0%');
        
        // Disable start button during processing
        $('#startBtn').prop('disabled', true);
        
        // Start processing phones
        processPhones(phones, apiKey, country, proxyList, proxyAuth, proxyType);
    }

    // Reset form
    $('#resetBtn').click(function() {
        $('#apiKey').val('');
        $('#country').val('');
        $('#proxyList').val('');
        $('#proxyAuth').val('');
        $('#proxyType').val('');
        $('#phoneListText').val('');
        $('#phoneListFile').val('');
        $('#phonePreview').html('No phone numbers loaded yet. Enter phone numbers manually or upload a file to see preview.');
        $('#startBtn').prop('disabled', true);
        $('#progressCard').addClass('d-none');
        $('#liveTable tbody').empty();
        $('#dieTable tbody').empty();
    });

    // Process phones with rotating proxies
    function processPhones(phones, apiKey, country, proxyList, proxyAuth, proxyType) {
        let currentIndex = 0;
        let liveCount = 0;
        let dieCount = 0;
        let proxyIndex = 0;
        
        // Function to process next phone
        function processNextPhone() {
            if (currentIndex >= phones.length) {
                // All phones processed
                $('#startBtn').prop('disabled', false);
                return;
            }
            
            const phone = phones[currentIndex];
            const proxy = proxyList[proxyIndex % proxyList.length];
            proxyIndex++;
            
            // Make API request
            checkPhone(phone, apiKey, country, proxy, proxyAuth, proxyType)
                .then(result => {
                    // Add to results
                    if (result.status === 'success' && result.valid === 'true') {
                        liveCount++;
                        $('#liveCount').text(liveCount);
                        addLiveResult(result);
                    } else {
                        dieCount++;
                        $('#dieCount').text(dieCount);
                        addDieResult(phone, result.msg || 'Invalid phone number');
                    }
                    
                    // Update progress
                    currentIndex++;
                    const progress = (currentIndex / phones.length) * 100;
                    $('#processedCount').text(currentIndex);
                    $('#remainingCount').text(phones.length - currentIndex);
                    $('.progress-bar').css('width', progress + '%').attr('aria-valuenow', progress);
                    $('#progressPercent').text(progress.toFixed(0) + '%');
                    
                    // Process next phone with a small delay to avoid rate limiting
                    setTimeout(processNextPhone, 100);
                })
                .catch(error => {
                    // Add to die results on error
                    dieCount++;
                    $('#dieCount').text(dieCount);
                    addDieResult(phone, error.message || 'API Error');
                    
                    // Update progress and continue
                    currentIndex++;
                    const progress = (currentIndex / phones.length) * 100;
                    $('#processedCount').text(currentIndex);
                    $('#remainingCount').text(phones.length - currentIndex);
                    $('.progress-bar').css('width', progress + '%').attr('aria-valuenow', progress);
                    $('#progressPercent').text(progress.toFixed(0) + '%');
                    
                    // Process next phone with a small delay
                    setTimeout(processNextPhone, 100);
                });
        }
        
        // Start processing
        processNextPhone();
    }
/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 1.0
*/
    // Check single phone via API
    function checkPhone(phone, apiKey, country, proxy, proxyAuth, proxyType) {
        return new Promise((resolve, reject) => {
            // Build API URL
            const url = `https://api.darkxcode.site/validator/carrier/?apikey=${encodeURIComponent(apiKey)}&phone=${encodeURIComponent(phone)}&proxy=${encodeURIComponent(proxy)}&proxyAuth=${encodeURIComponent(proxyAuth)}&type_proxy=${encodeURIComponent(proxyType)}&country=${encodeURIComponent(country)}`;
            
            // Make AJAX request
            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json',
                timeout: 30000,
                success: function(response) {
                    // Add to log
                    addLogEntry(phone, response.data?.status, response.data?.msg);
                    resolve(response.data);
                },
                error: function(xhr, status, error) {
                    // Add to log
                    addLogEntry(phone, 'error', error);
                    reject(new Error(error));
                }
            });
        });
    }

    // Add LIVE result to table
    function addLiveResult(data) {
        const row = `
            <tr>
                <td>${data.phone_number || data.phone}</td>
                <td>${data.info?.carrier || 'N/A'}</td>
                <td>${data.info?.coordinates ? `${data.info.coordinates.city}, ${data.info.coordinates.state}` : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info view-details" data-bs-toggle="tooltip" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success copy-item ms-1" data-bs-toggle="tooltip" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                </td>
            </tr>
        `;
        $('#liveTable tbody').append(row);
        
        // Initialize tooltips for new buttons
        $('[data-bs-toggle="tooltip"]').tooltip();
    }

    // Add DIE result to table
    function addDieResult(phone, reason) {
        const row = `
            <tr>
                <td>${phone}</td>
                <td>${reason}</td>
                <td>
                    <button class="btn btn-sm btn-outline-success copy-item" data-bs-toggle="tooltip" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                </td>
            </tr>
        `;
        $('#dieTable tbody').append(row);
        
        // Initialize tooltips for new buttons
        $('[data-bs-toggle="tooltip"]').tooltip();
    }

    // Add log entry
    function addLogEntry(phone, status, message) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const statusClass = status === 'success' ? 'text-success' : 'text-danger';
        
        const row = `
            <tr>
                <td>${timeString}</td>
                <td>${phone}</td>
                <td class="${statusClass}">${status || 'N/A'}</td>
                <td>${message || 'No message'}</td>
            </tr>
        `;
        $('#logTableBody').prepend(row);
    }

    // Clear log
    $('#clearLogBtn').click(function() {
        $('#logTableBody').empty();
    });

    // Copy LIVE results
    $('#copyLiveBtn').click(function() {
        const liveResults = [];
        $('#liveTable tbody tr').each(function() {
            const cells = $(this).find('td');
            liveResults.push({
                phone: cells.eq(0).text(),
                carrier: cells.eq(1).text(),
                location: cells.eq(2).text()
            });
        });
        
        const textToCopy = JSON.stringify(liveResults, null, 2);
        copyToClipboard(textToCopy);
        showToast('LIVE results copied to clipboard!');
    });

    // Copy DIE results
    $('#copyDieBtn').click(function() {
        const dieResults = [];
        $('#dieTable tbody tr').each(function() {
            const cells = $(this).find('td');
            dieResults.push({
                phone: cells.eq(0).text(),
                reason: cells.eq(1).text()
            });
        });
        
        const textToCopy = JSON.stringify(dieResults, null, 2);
        copyToClipboard(textToCopy);
        showToast('DIE results copied to clipboard!');
    });

    // Clear LIVE results
    $('#clearLiveBtn').click(function() {
        $('#liveTable tbody').empty();
        $('#liveCount').text(0);
        showToast('LIVE results cleared!');
    });

    // Clear DIE results
    $('#clearDieBtn').click(function() {
        $('#dieTable tbody').empty();
        $('#dieCount').text(0);
        showToast('DIE results cleared!');
    });

    // Export results
    $('#exportBtn').click(function() {
        // Collect all results
        const results = {
            live: [],
            die: []
        };
        
        $('#liveTable tbody tr').each(function() {
            const cells = $(this).find('td');
            results.live.push({
                phone: cells.eq(0).text(),
                carrier: cells.eq(1).text(),
                location: cells.eq(2).text()
            });
        });
        
        $('#dieTable tbody tr').each(function() {
            const cells = $(this).find('td');
            results.die.push({
                phone: cells.eq(0).text(),
                reason: cells.eq(1).text()
            });
        });
        
        // Create and download JSON file
        const dataStr = JSON.stringify(results, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `phone_carrier_lookup_${new Date().getTime()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('Results exported successfully!');
    });
/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 1.0
*/
    // Helper function to copy text to clipboard
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    // Helper function to show toast notification
    function showToast(message) {
        // Remove existing toasts
        $('.toast').remove();
        
        // Create toast element
        const toast = $(`
            <div class="toast align-items-center text-white bg-success border-0 position-fixed bottom-0 end-0 m-3" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `);
        
        // Add to body and show
        $('body').append(toast);
        new bootstrap.Toast(toast[0]).show();
    }

    // View log button
    $('#viewLogBtn').click(function() {
        $('#logModal').modal('show');
    });

    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();
});

/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 1.0
*/