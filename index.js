const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const scoreEl = document.querySelector("#scoreEl");
const bigScoreEl = document.querySelector("#bigScoreEl");
const startBtn = document.querySelector("#start");
const modal = document.querySelector("#modal");
const friction = 0.98;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const keys = {
	a: {
		pressed: false
	},
	s: {
		pressed: false
	},
	d: {
		pressed: false
	},
	w: {
		pressed: false
	}
}

let score;
let projectiles = [];
let enemies = [];
let particles = [];
let grade = [];

function init() {
	score = 0;
	scoreEl.innerHTML = score;
	player = new Player(centerX, centerY, 10, "white", {
		x: 0,
		y: 0
	});
	projectiles = [];
	enemies = [];
	particles = [];
	grade = [];

	const distance = 30;
	for (let i = 0 + 1; i < canvas.width; i += distance) {
		for (let j = 0 + 1; j < canvas.height; j += distance) {
			grade.push(new Point(i, j, 2, '#141414'));
		}
	}

	animate();
	spawnEnemies();
};

function spawnEnemies() {
	setInterval(() => {

		let x;
		let y;

		const radius = Math.random() * (30 - 4) + 4;

		if (Math.random() < 0.5) {
			x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
			y = Math.random() * canvas.height;
		} else {
			x = Math.random() * canvas.width;
			y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
		}

		const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

		const angle = Math.atan2(player.y - y, player.x - x);
		const velocity = {
			x: Math.cos(angle),
			y: Math.sin(angle)
		}

		enemies.push(new Enemy(x, y, radius, color, velocity));

	}, 1000);
}

let animationId;
let color = 0;
let colorFlag = -1;

function movement() {

	const aceleration = 0.20;
	const maxSpeed = 7;

	if (keys.a.pressed && player.x - player.radius >= 0) {
		player.velocity.x -= aceleration;
		if (player.velocity.x >= maxSpeed) player.velocity.x = maxSpeed;
	} else if (keys.d.pressed && player.x + player.radius <= canvas.width) {
		if (player.velocity.x <= (-1) * maxSpeed) player.velocity.x = (-1) * maxSpeed;
		player.velocity.x += aceleration;
	}

	if (keys.w.pressed && player.y - player.radius >= 0) {
		player.velocity.y -= aceleration;
		if (player.velocity.y >= maxSpeed) player.velocity.y = maxSpeed;
	} else if (keys.s.pressed && player.y + player.radius <= canvas.height) {
		player.velocity.y += aceleration;
		if (player.velocity.y <= (-1) * maxSpeed) player.velocity.y = (-1) * maxSpeed;
	}

	if (player.x - player.radius < 0) {
		player.x = 0 + player.radius;
		player.velocity.x *= -1;
	}
	if (player.x - player.radius > canvas.width - player.radius) {
		player.x = canvas.width - player.radius;
		player.velocity.x *= -1;
	}
	if (player.y - player.radius < 0) {
		player.y = 0 + player.radius;
		player.velocity.y *= -1;
	}
	if (player.y - player.radius > canvas.height - player.radius) {
		player.y = canvas.height - player.radius;
		player.velocity.y *= -1;
	}

	// console.log('x: ', player.velocity.x);
	// console.log('y: ', player.velocity.y);
}

function animate() {

	animationId = requestAnimationFrame(animate);
	c.fillStyle = 'rgba(0, 0, 0, 0.2)';
	c.fillRect(0, 0, canvas.width, canvas.height);

	if (color >= 360 || color <= 0) colorFlag *= -1;
	color += colorFlag;

	grade.forEach(point => {
		point.draw();
		const r = Math.hypot(point.x - player.x, point.y - player.y);
		const tam = 160;
		if (r <= tam && r >= -tam) {
			point.color = `hsl(${color}, ${r/tam > 0.99? 100* Math.sqrt(r/tam, 5) : 100*Math.pow(r/tam, 4)}%, ${r/tam > 0.99? 100* Math.sqrt(r/tam, 2) : 100*Math.pow(r/tam, 6)}%)`;
		} else {
			point.color = '#141414';
		}
	})

	player.update();
	movement();

	score += 1;
	scoreEl.innerHTML = score;

	particles.forEach((particle, index) => {
		particle.update();
		if (particle.alpha <= 0.01) {
			particles.splice(index, 1);
		} else {
			particle.update();
		}
	});

	projectiles.forEach((projectile, index) => {
		projectile.update();

		if (projectile.x + projectile.radius < 0 ||
			projectile.x - projectile.radius > canvas.width ||
			projectile.y + projectile.radius < 0 ||
			projectile.y - projectile.radius > canvas.height) {
			setTimeout(() => {
				projectiles.splice(index, 1);
			}, 0);
		}
	});

	enemies.forEach((enemy, index) => {

		const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
		const velocity = {
			x: Math.cos(angle),
			y: Math.sin(angle)
		}

		enemy.velocity = velocity;

		enemy.update();

		// game over
		const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
		if (dist - enemy.radius - player.radius < 0.5) {
			cancelAnimationFrame(animationId);
			modal.style.display = 'flex';
			bigScoreEl.innerHTML = score;
		}

		projectiles.forEach((projectile, projectileIndex) => {
			const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

			//	enemy hit
			if (dist - enemy.radius - projectile.radius < 0.5) {

				// explosion on hit
				for (let i = 0; i < enemy.radius * 2; i++) {
					particles.push(new Particle(projectile.x, projectile.y,
						Math.random() * 2, enemy.color, {
							x: (Math.random() - 0.5) * (Math.random() * 6),
							y: (Math.random() - 0.5) * (Math.random() * 6)
						}));
				}

				// enemy and projectile descructed 
				if (enemy.radius - 10 > 5) {
					gsap.to(enemy, {
						radius: enemy.radius - 10
					});
					setTimeout(() => {
						projectiles.splice(projectileIndex, 1);
					}, 0);
					score += 1000;
					scoreEl.innerHTML = score;
					grade.forEach(point => {
						point.color = "#303030";
					})
				} else {
					setTimeout(() => {
						projectiles.splice(projectileIndex, 1);
						enemies.splice(index, 1);
					}, 0);
					score += 1500;
					scoreEl.innerHTML = score;
					grade.forEach(point => {
						point.color = enemy.color;
					})
				}
			}
		});
	});
}

//	Create projectiles
addEventListener('click', (event) => {

	const mouseX = event.clientX;
	const mouseY = event.clientY;

	const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
	const velX = Math.cos(angle) * 5;
	const velY = Math.sin(angle) * 5;
	const velocity = {
		x: velX,
		y: velY
	}
	// const velocity_2 = {
	// 	x: player.velocity.x + Math.cos(angle - 0.1) * 4,
	// 	y: player.velocity.y + Math.sin(angle - 0.1) * 4
	// }
	// const velocity_3 = {
	// 	x: player.velocity.x + Math.cos(angle + 0.1) * 4,
	// 	y: player.velocity.y + Math.sin(angle + 0.1) * 4
	// }
	projectiles.push(new Projectile(player.x, player.y, 5, '#FF0000', velocity));
	// projectiles.push(new Projectile(player.x, player.y, 3, '#FF0000F0', velocity_2));
	// projectiles.push(new Projectile(player.x, player.y, 3, '#FF0000F0', velocity_3));
});

//	Start the game
startBtn.addEventListener('click', () => {
	modal.style.display = 'none';
	init();
});

addEventListener('keydown', ({
	key
}) => {
	switch (key) {
		case 'a':
			keys.a.pressed = true;
		case 'd':
			keys.d.pressed = true;
			break;
		case 'w':
			keys.w.pressed = true;
			break;
		case 's':
			keys.s.pressed = true;
			break;
	}
});

addEventListener('keyup', ({
	key
}) => {
	switch (key) {
		case 'a':
			keys.a.pressed = false;
		case 'd':
			keys.d.pressed = false;
			break;
		case 'w':
			keys.w.pressed = false;
			break;
		case 's':
			keys.s.pressed = false;
			break;
	}
});