"use strict";
function pong() {
    const svg = document.getElementById("canvas");
    let player_score = 0, cpu_score = 0, ball_speed = 3, ball_x_velocity = 1, ball_y_velocity = 1, tick_rate = 10, best_of = 11, ai_difficulty = 2.5, game_over = false, mousemove = Observable.fromEvent(svg, "mousemove").filter(() => !game_over);
    const pongObservable = Observable.interval(tick_rate).filter(() => !game_over), MAXBOUNCEANGLE = Math.PI / 3, player = playerPaddle(), cpu = cpuPaddle(), ball = pongBall(), mid = middleLine(), leftScore = displayScore("leftScore", 150, 100), rightScore = displayScore("rightScore", 450, 100);
    mousemove
        .filter(({ x, y }) => x < 600 && y < 600)
        .map(({ clientX, clientY }) => ({ x: clientX - 50, y: clientY - 50 }))
        .subscribe(({ y }) => player.attr('y', y));
    pongObservable
        .map(() => ({ ballX: Number(ball.attr('cx')), ballY: Number(ball.attr('cy')),
        ballR: Number(ball.attr('r')), }))
        .filter(({ ballX, ballR }) => ballX + ballR <= -10 || ballX - ballR >= 610)
        .subscribe(({ ballX, ballR }) => {
        if (ballX - ballR <= 0) {
            player_score++;
            ball.attr('cx', 300).attr('cy', 300);
            ball_x_velocity = -1;
            ball_y_velocity = 1;
            ball_speed = 3;
        }
        else {
            cpu_score++;
            ball.attr('cx', 300).attr('cy', 300);
            ball_x_velocity = 1;
            ball_y_velocity = 1;
            ball_speed = 3;
        }
    });
    pongObservable
        .subscribe(() => {
        document.getElementById('leftScore').textContent = cpu_score.toString();
        document.getElementById('rightScore').textContent = player_score.toString();
    });
    pongObservable
        .map(() => ({ ballX: Number(ball.attr('cx')), ballY: Number(ball.attr('cy')), ballR: Number(ball.attr('r')),
        player: player }))
        .filter(({ ballX, ballY, ballR, player }) => ballX + ballR >= Number(player.attr('x'))
        && ((ballY - ballR <= Number(player.attr('y')) + Number(player.attr('height')) && ballY - ballR >= Number(player.attr('y')))
            || (ballY + ballR <= Number(player.attr('y')) + Number(player.attr('height')) && ballY + ballR >= Number(player.attr('y')))))
        .subscribe(({ ballY, ballR, player }) => {
        let relativeIntersectY = Number(player.attr('y')) + (Number(player.attr('height')) / 2) - ballY + ballR, normalizedRelativeIntersectionY = (relativeIntersectY / (Number(player.attr('height')) / 2)), bounceAngle = normalizedRelativeIntersectionY * MAXBOUNCEANGLE;
        ball_x_velocity = ball_speed * -Math.cos(bounceAngle);
        ball_y_velocity = ball_speed * -Math.sin(bounceAngle);
    });
    pongObservable
        .map(() => ({ ballX: Number(ball.attr('cx')), ballY: Number(ball.attr('cy')), ballR: Number(ball.attr('r')),
        cpu: cpu }))
        .filter(({ ballX, ballY, ballR, cpu }) => ballX - ballR <= Number(cpu.attr('x'))
        && ((ballY - ballR <= Number(cpu.attr('y')) + Number(cpu.attr('height')) && ballY - ballR >= Number(cpu.attr('y')))
            || (ballY + ballR <= Number(cpu.attr('y')) + Number(cpu.attr('height')) && ballY + ballR >= Number(cpu.attr('y')))))
        .subscribe(({ ballY, ballR, cpu }) => {
        let relativeIntersectY = Number(cpu.attr('y')) + (Number(cpu.attr('height')) / 2) - ballY + ballR, normalizedRelativeIntersectionY = (relativeIntersectY / (Number(cpu.attr('height')) / 2)), bounceAngle = normalizedRelativeIntersectionY * MAXBOUNCEANGLE;
        ball_x_velocity = ball_speed * Math.cos(bounceAngle);
        ball_y_velocity = ball_speed * -Math.sin(bounceAngle);
    });
    pongObservable
        .map(() => ({ ballY: Number(ball.attr('cy')) }))
        .subscribe(({ ballY }) => {
        cpu.attr('y', ballY + ai_difficulty);
    });
    pongObservable
        .subscribe(() => {
        ball.attr('cx', ball_speed * ball_x_velocity + Number(ball.attr('cx')));
        ball.attr('cy', ball_speed * ball_y_velocity + Number(ball.attr('cy')));
    });
    pongObservable
        .map(() => ({ ballX: Number(ball.attr('cx')), ballY: Number(ball.attr('cy')), ballR: Number(ball.attr('r')) }))
        .filter(({ ballX, ballY, ballR }) => (ballY - ballR <= 0 || ballY + ballR >= 600)
        && (ballX - ballR > 0 || ballX + ballR < 600))
        .subscribe(() => {
        ball_y_velocity *= -1;
    });
    pongObservable
        .map(() => ({ playerScore: player_score, cpuScore: cpu_score }))
        .filter(({ playerScore, cpuScore }) => playerScore === best_of || cpuScore === best_of)
        .subscribe(() => {
        if (player_score === best_of) {
            player.attr('y', 250);
            cpu.attr('y', 250);
        }
        else if (cpu_score === best_of) {
            player.attr('y', 250);
            cpu.attr('y', 250);
        }
        game_over = true;
    });
}
function playerPaddle() {
    const svg = document.getElementById("canvas"), rect = new Elem(svg, 'rect')
        .attr('x', 550).attr('y', 250)
        .attr('width', 10).attr('height', 100)
        .attr('fill', '#FFFFFF');
    return rect;
}
function cpuPaddle() {
    const svg = document.getElementById('canvas'), rect = new Elem(svg, 'rect')
        .attr('x', 50).attr('y', 50)
        .attr('width', 10).attr('height', 100)
        .attr('fill', '#FFFFFF');
    return rect;
}
function pongBall() {
    const svg = document.getElementById("canvas"), ball = new Elem(svg, 'circle')
        .attr('cx', 300).attr('cy', 300)
        .attr('r', 5)
        .attr('fill', '#FFFFFF');
    return ball;
}
function middleLine() {
    const svg = document.getElementById('canvas'), line = new Elem(svg, 'line')
        .attr('x1', 300).attr('x2', 300)
        .attr('y1', 5).attr('y2', 600)
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 5)
        .attr('stroke-dasharray', 12);
    return line;
}
function displayScore(id, x, y) {
    const svg = document.getElementById('canvas'), score = new Elem(svg, 'text')
        .attr('id', id)
        .attr('x', x)
        .attr('y', y)
        .attr('width', 30).attr('height', 30)
        .attr('fill', '#FFFFFF').attr('font-size', "48px");
    return score;
}
if (typeof window != 'undefined')
    window.onload = () => {
        pong();
    };
//# sourceMappingURL=pong.js.map