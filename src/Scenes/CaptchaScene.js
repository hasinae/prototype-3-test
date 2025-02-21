export default class CaptchaScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CaptchaScene' });
    }

    preload() {
        this.load.image('trafficlight1', 'assets/trafficlight1.jpg');
        this.load.image('trafficlight2', 'assets/trafficlight2.jpeg');
        this.load.image('trafficlight3', 'assets/trafficlight3.jpg');
        this.load.image('bicycle', 'assets/bicycle1.jpg');
        this.load.image('stopsign', 'assets/stopsign1.jpg');
        this.load.image('tree', 'assets/tree.jpg');
        this.load.image('ad', 'assets/ad.jpg'); 
        this.load.image('restartButton', 'assets/restartButton.jpeg');
    }

    create() {
        this.score = 0;
        this.timeLeft = 30;
        this.gameOver = false; 
        this.timerStarted = false;

        // Set up crisp visuals
        this.cameras.main.setRoundPixels(true); // Rounds pixels to avoid blur
        this.scaleMode = Phaser.Scale.NONE;

        // Instruction text
        this.instructionText = this.add.text(20, 20, 'Click to start and select the traffic lights!', { fontSize: '18px', fill: '#000000' }).setResolution(2);
        this.scoreText = this.add.text(20, 60, 'Score: 0', { fontSize: '18px', fill: '#000000' }).setResolution(2);
        this.timerText = this.add.text(20, 100, `Time Left: ${this.timeLeft}`, { fontSize: '18px', fill: '#000000' }).setResolution(2);

        // Set up a 3x3 grid with larger images
        this.setupGrid();

        // Create the ad/distraction image, positioned to cover the grid, initially hidden
        this.adImage = this.add.image(400, 400, 'ad').setDisplaySize(450, 450).setVisible(false).setInteractive();
        this.adImage.on('pointerdown', () => this.handleAdClick()); // Handle ad click

        // The countdown timer event, but paused initially
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true,
            paused: true // Paused until the first click
        });

        // Set up a timer for the ad/distraction to appear and move across the screen
        this.time.addEvent({
            delay: 5000, // Every 5 seconds, show the ad
            callback: this.showAndMoveAd,
            callbackScope: this,
            loop: true
        });

        // Set up a timer to swap positions and make all images move side to side periodically
        this.time.addEvent({
            delay: 4000, // Swap positions every 4 seconds
            callback: this.swapAndMoveAllImages,
            callbackScope: this,
            loop: true
        });
    }

    setupGrid() {
        const imageSize = 150; // Set uniform size for larger images

        // Define positions for a 3x3 grid layout, centered on the screen
        this.gridPositions = [
            { x: 200, y: 200 },
            { x: 400, y: 200 },
            { x: 600, y: 200 },
            { x: 200, y: 400 },
            { x: 400, y: 400 },
            { x: 600, y: 400 },
            { x: 200, y: 600 },
            { x: 400, y: 600 },
            { x: 600, y: 600 }
        ];

        const imageKeys = [
            'trafficlight1', 'trafficlight2', 'trafficlight3',
            'bicycle', 'stopsign', 'tree', 'bicycle', 'tree', 'stopsign'
        ];

        this.allImages = []; // Combine all CAPTCHA and distraction images into one array

        // Place all images in the grid
        this.gridPositions.forEach((position, index) => {
            const image = this.add.image(position.x, position.y, imageKeys[index])
                .setDisplaySize(imageSize, imageSize)
                .setInteractive();

            this.allImages.push(image);

            // Assign click handlers based on image type
            const isCaptcha = imageKeys[index].includes('trafficlight');
            image.on('pointerdown', () => this.handleCaptchaClick(isCaptcha, image));
        });
    }

    handleCaptchaClick(isCaptcha, image) {
        if (this.gameOver) return;

        // Start the timer on the first click
        if (!this.timerStarted) {
            this.timerStarted = true;
            this.timerEvent.paused = false; // Start the countdown timer
        }

        if (isCaptcha) {
            this.score += 10;
            this.instructionText.setText('Good job! You clicked a traffic light.');
        } else {
            this.score -= 5;
            this.instructionText.setText('Oops! That’s not a traffic light.');
        }
        this.scoreText.setText(`Score: ${this.score}`);

        // Fade out the image
        this.tweens.add({
            targets: image,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                // Hide the image for 1 second
                image.setVisible(false);

                // Move to a new position
                const newPosition = Phaser.Utils.Array.GetRandom(this.gridPositions);
                image.setPosition(newPosition.x, newPosition.y);

                // Show the image again after 1 second and fade it back in
                this.time.delayedCall(1000, () => {
                    image.setVisible(true);
                    this.tweens.add({
                        targets: image,
                        alpha: 1,
                        duration: 500
                    });
                });
            }
        });
    }

    handleAdClick() {
        if (this.gameOver) return;

        // Start the timer on the first click
        if (!this.timerStarted) {
            this.timerStarted = true;
            this.timerEvent.paused = false; // Start the countdown timer
        }

        // Decrease score if the ad is clicked
        this.score -= 10;
        this.instructionText.setText("Don't click the ad! -10 points.");
        this.scoreText.setText(`Score: ${this.score}`);
    }

    updateTimer() {
        if (this.gameOver) return;

        this.timeLeft -= 1;
        this.timerText.setText(`Time Left: ${this.timeLeft}`);
        
        // End game when timer reaches zero
        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    endGame() {
        this.gameOver = true; // Mark game as over
        this.time.removeAllEvents();
        this.allImages.forEach(image => image.disableInteractive());
        this.adImage.disableInteractive();
    
        // Stop all active tweens to prevent movement
        this.tweens.killAll();
    
        // Display "Game Over" message and final score
        this.add.text(500, 300, 'Game Over!', { fontSize: '50px', fill: '#000000' }).setOrigin(0.5);
        this.add.text(500, 350, `Final Score: ${this.score}`, { fontSize: '40px', fill: '#000000' }).setOrigin(0.5);
    
        // Create a return to menu button with a background rectangle and interactive text
        const menuButtonBg = this.add.rectangle(500, 450, 200, 60, 0x006400).setOrigin(0.5);
        const menuButtonText = this.add.text(500, 450, 'Main Menu', { fontSize: '36px', fill: '#00ff00' }).setOrigin(0.5).setInteractive();
    
        menuButtonText.on('pointerdown', () => {
            this.scene.start('IntroScene'); // Go back to the main menu (IntroScene)
        });
        menuButtonText.on('pointerover', () => {
            menuButtonText.setStyle({ fill: '#ff0000' });
            menuButtonBg.setFillStyle(0x228B22);
        });
        menuButtonText.on('pointerout', () => {
            menuButtonText.setStyle({ fill: '#00ff00' });
            menuButtonBg.setFillStyle(0x006400);
        });
    }
    

    swapAndMoveAllImages() {
        if (this.gameOver) return;

        // Shuffle all grid positions
        Phaser.Utils.Array.Shuffle(this.gridPositions);

        // Apply new positions to all images and make them move side to side
        this.allImages.forEach((image, index) => {
            image.setPosition(this.gridPositions[index].x, this.gridPositions[index].y);

            // Make each image move side to side within a random range
            this.tweens.add({
                targets: image,
                x: image.x + Phaser.Math.Between(-50, 50),
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
        });
    }

    showAndMoveAd() {
        if (this.gameOver) return;

        // Show the ad and move it side to side
        this.adImage.setVisible(true);
        this.instructionText.setText("Select the traffic lights! Ignore the ad.");

        // Move the ad side to side across the screen
        this.tweens.add({
            targets: this.adImage,
            x: 600, // Moves to the right
            duration: 2000,
            yoyo: true,
            repeat: -1
        });

        // Hide the ad and reset the instruction text after 4 seconds
        this.time.delayedCall(4000, () => {
            this.adImage.setVisible(false);
            this.instructionText.setText("Select the traffic lights!");
        });
    }

    update() {
        // Additional animations or timed events can be added here
    }
}
 
