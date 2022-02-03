const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
const scoreEl = document.querySelector("#scoreEl");
const bigScoreEl = document.querySelector("#bigScoreEl");
const startBtn = document.querySelector("#start");
const modal = document.querySelector("#modal");

canvas.width = innerWidth;
canvas.height = innerHeight;

class Player{
	constructor(x, y, radius, color){
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color; 
	}

	draw(){
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.color;
		c.fill();
	}
}

class Projectile {
	constructor(x, y, radius, color, velocity){
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color; 
		this.velocity = velocity;
	}

	draw(){
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.color;
		c.fill();
	}

	update(){
		this.draw();
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}
}

class Enemy {
	constructor(x, y, radius, color, velocity){
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color; 
		this.velocity = velocity;
	}

	draw(){
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.color;
		c.fill();
	}

	update(){
		this.draw();
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}
}

const friction = 0.98;
class Particle {
	constructor(x, y, radius, color, velocity){
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color; 
		this.velocity = velocity;
		this.alpha = 1;
	}

	draw(){
		c.save();
		c.globalAlpha = this.alpha;
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.color;
		c.fill();
		c.restore();
	}

	update(){
		this.draw();
		this.velocity.x *= friction;
		this.velocity.y *= friction;
		this.x += this.velocity.x;
		this.y += this.velocity.y;
		this.alpha -= 0.01;
	}	
}

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

let score;
let player = new Player(centerX, centerY, 10,"white");
let projectiles = [];
let enemies = [];
let particles = [];

function init(){
	score = 0;
	scoreEl.innerHTML = score;
	player = new Player(centerX, centerY, 10,"white");
	projectiles = [];
	enemies = [];
	particles = [];

	animate();
	spawnEnemies();
};

function spawnEnemies(){
	setInterval(()=>{

		let x;
		let y;

		const radius = Math.random() * (30 - 4) + 4;

		if(Math.random() < 0.5) {
			x = Math.random() < 0.5 ? 0 - radius: canvas.width + radius;
			y = Math.random() * canvas.height;
		} else {
			x = Math.random() * canvas.width;
			y = Math.random() < 0.5 ? 0 - radius: canvas.height + radius;
		}

		const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

		const angle = Math.atan2(canvas.height/2 - y, canvas.width/2 - x);
		const velocity = {
			x: Math.cos(angle),
			y: Math.sin(angle)
		}

		enemies.push(new Enemy(x, y, radius, color, velocity));

	}, 1000);
}

let animationId;
function animate(){
	animationId = requestAnimationFrame(animate);
	c.fillStyle = 'rgba(0, 0, 0, 0.1)';
	c.fillRect(0,0,canvas.width, canvas.height);
	player.draw();

	particles.forEach((particle, index) => {
		particle.update();
		if (particle.alpha <= 0.01) {
			particles.splice(index, 1);
		}else{
			particle.update();
		}
	});

	projectiles.forEach((projectile, index) => {
		projectile.update();

		if( projectile.x + projectile.radius < 0 ||
			projectile.x - projectile.radius > canvas.width ||
			projectile.y + projectile.radius < 0 ||
			projectile.y - projectile.radius > canvas.height){
			setTimeout(()=>{
				projectiles.splice(index, 1);
			}, 0);
	}
});

	enemies.forEach((enemy,index) => {
		enemy.update();

		// game over
		const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
		if(dist - enemy.radius - player.radius < 0.5){
			cancelAnimationFrame(animationId);
			modal.style.display = 'flex';
			bigScoreEl.innerHTML = score;
		}

		projectiles.forEach((projectile, projectileIndex) => {
			const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
			
			//	enemy hit
			if(dist - enemy.radius - projectile.radius < 0.5){

				// explosion on hit
				for(let i = 0; i < enemy.radius * 2; i++){
					particles.push(new Particle(projectile.x, projectile.y,
						Math.random() * 2, enemy.color, {
							x: (Math.random() - 0.5) * (Math.random() * 6),
							y: (Math.random() - 0.5) * (Math.random() * 6)
						}));
				}

				// enemy and projectile descructed 
				if(enemy.radius - 10 > 5){
					gsap.to(enemy, {
						radius: enemy.radius - 10
					});
					setTimeout(()=>{
						projectiles.splice(projectileIndex, 1);
					}, 0);
					score += 100;
					scoreEl.innerHTML = score;
				}else{
					setTimeout(()=>{
						projectiles.splice(projectileIndex, 1);
						enemies.splice(index, 1);
					}, 0);
					score += 150;
					scoreEl.innerHTML = score;
				}
			}
		});
	});
}


addEventListener('click', (event)=>{
	const mouseX = event.clientX;
	const mouseY = event.clientY;
	const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
	const velocity = {
		x: Math.cos(angle) * 5,
		y: Math.sin(angle) * 5
	}
	projectiles.push(new Projectile(centerX, centerY, 5, 'white', velocity));
});


startBtn.addEventListener('click', ()=>{
	modal.style.display = 'none';
	init();
});