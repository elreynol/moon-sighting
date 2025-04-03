// Form handling and API communication
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('moonsightingForm');
    const loading = document.getElementById('loading');
    const success = document.getElementById('success');
    const error = document.getElementById('error');
    const successDetails = document.getElementById('successDetails');
    const errorMessage = document.getElementById('errorMessage');

    // Form validation
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset messages
        hideAllMessages();
        
        // Validate form data
        if (!validateForm()) {
            return;
        }

        // Show loading state
        loading.classList.remove('hidden');

        try {
            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Convert numeric values
            data.latitude = parseFloat(data.latitude);
            data.longitude = parseFloat(data.longitude);
            data.eventDuration = parseInt(data.eventDuration);
            data.timeAdjustment = parseInt(data.timeAdjustment);
            data.monthsToCreate = parseInt(data.monthsToCreate);

            // Send data to backend
            const response = await fetch('/api/create-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Show success message
                showSuccess(result);
            } else {
                // Show error message
                showError(result.message || 'An error occurred while creating events.');
            }
        } catch (err) {
            showError('Failed to connect to the server. Please try again later.');
        } finally {
            loading.classList.add('hidden');
        }
    });

    // Form validation function
    function validateForm() {
        const latitude = document.getElementById('latitude').value;
        const longitude = document.getElementById('longitude').value;
        const monthsToCreate = document.getElementById('monthsToCreate').value;

        // Validate latitude
        if (latitude < -90 || latitude > 90) {
            showError('Latitude must be between -90 and 90 degrees.');
            return false;
        }

        // Validate longitude
        if (longitude < -180 || longitude > 180) {
            showError('Longitude must be between -180 and 180 degrees.');
            return false;
        }

        // Validate months to create
        if (monthsToCreate < 1 || monthsToCreate > 12) {
            showError('Number of months must be between 1 and 12.');
            return false;
        }

        return true;
    }

    // Helper functions for showing/hiding messages
    function hideAllMessages() {
        loading.classList.add('hidden');
        success.classList.add('hidden');
        error.classList.add('hidden');
    }

    function showSuccess(result) {
        successDetails.innerHTML = `
            <p>Successfully created ${result.events} events!</p>
            <p>Calendar sharing link: <a href="${result.sharing.link}" target="_blank">${result.sharing.link}</a></p>
            <p>ICS file link: <a href="${result.sharing.icsLink}" target="_blank">${result.sharing.icsLink}</a></p>
        `;
        success.classList.remove('hidden');
    }

    function showError(message) {
        errorMessage.textContent = message;
        error.classList.remove('hidden');
    }

    // Add input validation for numeric fields
    const numericInputs = form.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            const min = parseFloat(input.min);
            const max = parseFloat(input.max);

            if (isNaN(value)) {
                input.setCustomValidity('Please enter a valid number');
            } else if (min !== undefined && value < min) {
                input.setCustomValidity(`Value must be at least ${min}`);
            } else if (max !== undefined && value > max) {
                input.setCustomValidity(`Value must be at most ${max}`);
            } else {
                input.setCustomValidity('');
            }
        });
    });

    // Add geolocation support for latitude/longitude
    const addressInput = document.getElementById('address');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');

    addressInput.addEventListener('blur', async () => {
        if (addressInput.value && !latitudeInput.value && !longitudeInput.value) {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput.value)}`);
                const data = await response.json();
                
                if (data.length > 0) {
                    latitudeInput.value = data[0].lat;
                    longitudeInput.value = data[0].lon;
                }
            } catch (err) {
                console.error('Failed to geocode address:', err);
            }
        }
    });
}); 