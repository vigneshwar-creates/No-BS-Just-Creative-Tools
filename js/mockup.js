// mockup.js - Smart Mockup Generator

document.addEventListener('DOMContentLoaded', function() {
    // Canvas and context
    const canvas = document.getElementById('mockup-canvas');
    const ctx = canvas.getContext('2d');
    
    // Elements
    const templateSelect = document.getElementById('template-select');
    const designUpload = document.getElementById('design-upload');
    const resetBtn = document.getElementById('reset-btn');
    const scaleSlider = document.getElementById('scale-slider');
    const rotationSlider = document.getElementById('rotation-slider');
    const opacitySlider = document.getElementById('opacity-slider');
    const scaleValue = document.getElementById('scale-value');
    const rotationValue = document.getElementById('rotation-value');
    const opacityValue = document.getElementById('opacity-value');
    const exportPngBtn = document.getElementById('export-png');
    const exportJpgBtn = document.getElementById('export-jpg');
    const mockupAdjustments = document.querySelector('.mockup-adjustments');
    
    // State
    let templateData = null;
    let designImage = null;
    let designX = 0, designY = 0;
    let designScale = 1;
    let designRotation = 0; // in degrees
    let designOpacity = 1;
    let isDesignLoaded = false;
    
    // Template definitions (placeholder - in reality these would reference actual images)
    const templates = {
        smartphone: {
            name: 'Smartphone',
            width: 400,
            height: 800,
            baseColor: '#0a0a0a',
            screenArea: { x: 50, y: 100, width: 300, height: 600 },
            cameraArea: { x: 175, y: 50, width: 50, height: 20 }
        },
        laptop: {
            name: 'Laptop',
            width: 800,
            height: 500,
            baseColor: '#1a1a1a',
            screenArea: { x: 100, y: 50, width: 600, height: 400 }
        },
        mug: {
            name: 'Mug',
            width: 500,
            height: 400,
            baseColor: '#ffffff',
            wrapArea: { x: 50, y: 100, width: 400, height: 200, isWrap: true }
        },
        tshirt: {
            name: 'T-Shirt',
            width: 500,
            height: 600,
            baseColor: '#ffffff',
            frontArea: { x: 100, y: 150, width: 300, height: 400 }
        }
    };
    
    // Initialize
    function init() {
        // Set canvas size to match initial template
        updateCanvasSize(templates.smartphone);
        loadTemplate('smartphone');
        
        // Event listeners
        templateSelect.addEventListener('change', function(e) {
            loadTemplate(e.target.value);
        });
        
        designUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    designImage = new Image();
                    designImage.onload = function() {
                        isDesignLoaded = true;
                        // Center design in screen area initially
                        centerDesign();
                        render();
                        mockupAdjustments.style.display = 'block';
                    };
                    designImage.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        
        resetBtn.addEventListener('click', resetMockup);
        
        scaleSlider.addEventListener('input', function(e) {
            designScale = parseFloat(e.target.value) / 100;
            scaleValue.textContent = e.target.value + '%';
            render();
        });
        
        rotationSlider.addEventListener('input', function(e) {
            designRotation = parseFloat(e.target.value);
            rotationValue.textContent = e.target.value + '°';
            render();
        });
        
        opacitySlider.addEventListener('input', function(e) {
            designOpacity = parseFloat(e.target.value) / 100;
            opacityValue.textContent = e.target.value + '%';
            render();
        });
        
        exportPngBtn.addEventListener('click', function() {
            exportMockup('png');
        });
        
        exportJpgBtn.addEventListener('click', function() {
            exportMockup('jpg');
        });
    }
    
    function loadTemplate(templateName) {
        templateData = templates[templateName];
        updateCanvasSize(templateData);
        resetMockup();
    }
    
    function updateCanvasSize(template) {
        canvas.width = template.width;
        canvas.height = template.height;
    }
    
    function resetMockup() {
        designScale = 1;
        designRotation = 0;
        designOpacity = 1;
        scaleSlider.value = 100;
        rotationSlider.value = 0;
        opacitySlider.value = 100;
        scaleValue.textContent = '100%';
        rotationValue.textContent = '0°';
        opacityValue.textContent = '100%';
        
        if (designImage) {
            centerDesign();
        }
        render();
    }
    
    function centerDesign() {
        if (!templateData || !designImage) return;
        
        // Center in the screen area
        const area = templateData.screenArea || templateData.frontArea || templateData.wrapArea;
        if (!area) return;
        
        // Calculate scale to fit area while maintaining aspect ratio
        const imageAspect = designImage.width / designImage.height;
        const areaAspect = area.width / area.height;
        
        if (imageAspect > areaAspect) {
            // Image is wider, fit to width
            designScale = area.width / designImage.width;
        } else {
            // Image is taller, fit to height
            designScale = area.height / designImage.height;
        }
        
        // Add some padding
        designScale *= 0.9;
        
        // Center position
        designX = area.x + (area.width - designImage.width * designScale) / 2;
        designY = area.y + (area.height - designImage.height * designScale) / 2;
    }
    
    function render() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!templateData) return;
        
        // Draw base template (placeholder)
        ctx.fillStyle = templateData.baseColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw template areas (for visualization)
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        
        if (templateData.screenArea) {
            drawRect(templateData.screenArea);
        }
        if (templateData.frontArea) {
            drawRect(templateData.frontArea);
        }
        if (templateData.wrapArea) {
            // For wrap area, we'll just draw a rectangle for now
            drawRect(templateData.wrapArea);
        }
        if (templateData.cameraArea) {
            drawRect(templateData.cameraArea);
        }
        
        // Draw design if loaded
        if (isDesignLoaded && designImage) {
            ctx.save();
            
            // Translate to center of design for rotation
            const centerX = designX + (designImage.width * designScale) / 2;
            const centerY = designY + (designImage.height * designScale) / 2;
            
            ctx.translate(centerX, centerY);
            ctx.rotate(designRotation * Math.PI / 180);
            ctx.globalAlpha = designOpacity;
            
            // Draw image
            ctx.drawImage(
                designImage,
                - (designImage.width * designScale) / 2,
                - (designImage.height * designScale) / 2,
                designImage.width * designScale,
                designImage.height * designScale
            );
            
            ctx.restore();
        }
        
        // Draw instruction text if no design
        if (!isDesignLoaded) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '16px Space Mono';
            ctx.textAlign = 'center';
            ctx.fillText('Upload your design to begin', canvas.width / 2, canvas.height / 2);
        }
    }
    
    function drawRect(area) {
        ctx.beginPath();
        ctx.rect(area.x, area.y, area.width, area.height);
        ctx.stroke();
    }
    
    function exportMockup(format) {
        if (!isDesignLoaded) {
            alert('Please upload a design first');
            return;
        }
        
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const filename = `mockup-${Date.now()}.${format}`;
        
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, mimeType);
    }
    
    // Initialize the app
    init();
    
    // Theme toggle (shared with main app)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            themeToggle.querySelector('.icon-moon').style.display = isDark ? 'none' : 'inline';
            themeToggle.querySelector('.icon-sun').style.display = isDark ? 'inline' : 'none';
        });
    }
});