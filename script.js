class Wheel {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.members = [];
        this.rotation = 0;
        this.isSpinning = false;
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
        ];
        this.loadSavedWheels();
    }

    addMember(name) {
        if (name.trim() && !this.members.includes(name.trim())) {
            this.members.push(name.trim());
            this.draw();
            return true;
        }
        return false;
    }

    reset() {
        this.members = [];
        this.rotation = 0;
        this.draw();
    }

    draw() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.members.length === 0) {
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#666';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Add team members to start', centerX, centerY);
            return;
        }

        const sliceAngle = (2 * Math.PI) / this.members.length;

        for (let i = 0; i < this.members.length; i++) {
            const startAngle = i * sliceAngle + this.rotation;
            const endAngle = startAngle + sliceAngle;

            // Draw slice
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = this.colors[i % this.colors.length];
            this.ctx.fill();
            this.ctx.stroke();

            // Draw text
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(this.members[i], radius - 20, 5);
            this.ctx.restore();
        }
    }

    spin() {
        if (this.isSpinning || this.members.length === 0) return;

        this.isSpinning = true;
        const spinButton = document.getElementById('spinButton');
        spinButton.disabled = true;

        const extraSpins = 5; // Number of full rotations
        const randomAngle = Math.random() * 2 * Math.PI;
        const totalRotation = extraSpins * 2 * Math.PI + randomAngle;
        const duration = 5000; // 5 seconds
        const startTime = performance.now();
        const startRotation = this.rotation;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth deceleration
            const easeOut = (t) => 1 - Math.pow(1 - t, 3);
            
            this.rotation = startRotation + totalRotation * easeOut(progress);
            this.draw();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                spinButton.disabled = false;
                
                // Calculate the selected member
                const normalizedRotation = this.rotation % (2 * Math.PI);
                const sliceAngle = (2 * Math.PI) / this.members.length;
                const selectedIndex = Math.floor(
                    (2 * Math.PI - normalizedRotation) / sliceAngle
                ) % this.members.length;
                
                const selectedMember = this.members[selectedIndex];
                const result = document.getElementById('result');
                result.textContent = `Selected: ${selectedMember}`;

                // Create and show splash animation
                const splash = document.createElement('div');
                splash.className = 'splash';
                splash.textContent = selectedMember;
                document.body.appendChild(splash);

                // Create confetti
                const createFirework = (x, y) => {
                    const particleCount = 30;
                    const angleStep = (Math.PI * 2) / particleCount;
                    
                    for (let i = 0; i < particleCount; i++) {
                        const confetti = document.createElement('div');
                        confetti.className = 'confetti';
                        
                        // Calculate random distance and angle for explosion
                        const angle = angleStep * i;
                        const distance = 100 + Math.random() * 50;
                        const xOffset = Math.cos(angle) * distance;
                        const yOffset = Math.sin(angle) * distance;
                        
                        // Set initial position
                        confetti.style.left = x + 'px';
                        confetti.style.top = y + 'px';
                        
                        // Set explosion direction using CSS variables
                        confetti.style.setProperty('--x', xOffset + 'px');
                        confetti.style.setProperty('--y', yOffset + 'px');
                        
                        document.body.appendChild(confetti);
                        
                        // Remove confetti after animation
                        confetti.addEventListener('animationend', () => {
                            confetti.remove();
                        });
                    }
                };

                // Create multiple fireworks
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                
                // Main firework
                createFirework(centerX, centerY);
                
                // Additional fireworks with slight delays
                setTimeout(() => createFirework(centerX - 100, centerY - 50), 100);
                setTimeout(() => createFirework(centerX + 100, centerY - 50), 200);
                setTimeout(() => createFirework(centerX - 50, centerY + 50), 300);
                setTimeout(() => createFirework(centerX + 50, centerY + 50), 400);

                // Remove splash element after animation
                splash.addEventListener('animationend', () => {
                    splash.remove();
                });
            }
        };

        requestAnimationFrame(animate);
    }

    saveWheel(name) {
        if (!name.trim()) {
            this.showNotification('Please enter a name for the wheel', 'error');
            return false;
        }
        if (this.members.length === 0) {
            this.showNotification('Cannot save an empty wheel', 'error');
            return false;
        }

        const savedWheels = this.getSavedWheels();
        savedWheels[name] = this.members;
        localStorage.setItem('savedWheels', JSON.stringify(savedWheels));
        this.showNotification('Wheel saved successfully!');
        this.updateSavedWheelsList();
        return true;
    }

    loadWheel(name) {
        const savedWheels = this.getSavedWheels();
        if (savedWheels[name]) {
            this.members = [...savedWheels[name]];
            this.rotation = 0;
            this.draw();
            this.showNotification('Wheel loaded successfully!');
            return true;
        }
        return false;
    }

    deleteWheel(name) {
        const savedWheels = this.getSavedWheels();
        if (savedWheels[name]) {
            delete savedWheels[name];
            localStorage.setItem('savedWheels', JSON.stringify(savedWheels));
            this.updateSavedWheelsList();
            this.showNotification('Wheel deleted successfully!');
            return true;
        }
        return false;
    }

    getSavedWheels() {
        const saved = localStorage.getItem('savedWheels');
        return saved ? JSON.parse(saved) : {};
    }

    loadSavedWheels() {
        this.updateSavedWheelsList();
    }

    updateSavedWheelsList() {
        const select = document.getElementById('savedWheels');
        const savedWheels = this.getSavedWheels();
        
        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Add saved wheels to the select element
        Object.keys(savedWheels).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the wheel
const canvas = document.getElementById('wheel');
const wheel = new Wheel(canvas);

// Event listeners
document.getElementById('addMember').addEventListener('click', () => {
    const input = document.getElementById('memberInput');
    if (wheel.addMember(input.value)) {
        input.value = '';
    }
});

document.getElementById('memberInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const input = document.getElementById('memberInput');
        if (wheel.addMember(input.value)) {
            input.value = '';
        }
    }
});

document.getElementById('spinButton').addEventListener('click', () => {
    wheel.spin();
});

document.getElementById('resetButton').addEventListener('click', () => {
    wheel.reset();
    document.getElementById('result').textContent = '';
});

// Save wheel event listener
document.getElementById('saveWheel').addEventListener('click', () => {
    const nameInput = document.getElementById('wheelName');
    if (wheel.saveWheel(nameInput.value)) {
        nameInput.value = '';
    }
});

// Load wheel event listener
document.getElementById('loadWheel').addEventListener('click', () => {
    const select = document.getElementById('savedWheels');
    if (select.value) {
        wheel.loadWheel(select.value);
    } else {
        wheel.showNotification('Please select a wheel to load', 'error');
    }
});

// Delete wheel event listener
document.getElementById('deleteWheel').addEventListener('click', () => {
    const select = document.getElementById('savedWheels');
    if (select.value) {
        if (confirm('Are you sure you want to delete this wheel?')) {
            wheel.deleteWheel(select.value);
            select.value = '';
        }
    } else {
        wheel.showNotification('Please select a wheel to delete', 'error');
    }
}); 