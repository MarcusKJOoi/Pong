// FIT2102 2018 Assignment 1
// https://docs.google.com/document/d/1woMAgJVf1oL3M49Q8N3E1ykTuTu5_r28_MQPVS5QIVo/edit?usp=sharing

function pong() {
  // Inside this function you will use the classes and functions 
  // defined in svgelement.ts and observable.ts
  // to add visuals to the svg element in pong.html, animate them, and make them interactive.
  // Study and complete the tasks in basicexamples.ts first to get ideas.

  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.

  const svg = document.getElementById("canvas")!;

  let 
    player_score = 0, //right paddle
    cpu_score = 0, //left paddle
    ball_speed = 3, 
    ball_x_velocity = 1, //positive for going right, negative for going left
    ball_y_velocity = 1, //positive for going down, negative for going up
    tick_rate = 10, //how many times the observable updates in ms
    best_of = 11, //how many points required to win a game
    ai_difficulty = 2.5,
    game_over = false, //flag to check if anyone has won the game
    mousemove = Observable.fromEvent<MouseEvent>(svg, "mousemove").filter(() => !game_over);

  const 
    // keypress = Observable.fromEvent<KeyboardEvent>(svg, "keypress"),
    pongObservable = Observable.interval(tick_rate).filter(() => !game_over),
    MAXBOUNCEANGLE = Math.PI / 3, //60 degrees
    player = playerPaddle(),
    cpu = cpuPaddle(),
    ball = pongBall(),
    mid = middleLine(),
    leftScore = displayScore("leftScore", 150, 100), //displays cpu's score
    rightScore = displayScore("rightScore", 450, 100); //displays player's score
    // instructions = displayInst();


  /**
   * Controls the right paddle when the player's mouse is located in the canvas.
   * x - 50 and y - 50 to move the paddle from the middle
   */
  mousemove
  .filter(({x, y}) => x < 600 && y < 600)
  .map(({clientX, clientY}) => ({x: clientX - 50, y: clientY - 50}))
  .subscribe(({y}) => player.attr('y', y));

  /**
   * Logic for player or cpu paddle scoring a point.
   * If the whole ball has gone out of bounds, the paddle on the opposite side scores a point.
   */
  pongObservable
  .map(() => ({ ballX: Number(ball.attr('cx')), ballY: Number(ball.attr('cy')), 
                ballR: Number(ball.attr('r')), }))
  .filter(({ ballX, ballR }) => ballX + ballR <= -10 || ballX - ballR >= 610)
  .subscribe(({ ballX, ballR }) => {
    if (ballX - ballR <= 0) {
      player_score++;
      ball .attr('cx', 300) .attr('cy', 300);
      ball_x_velocity = -1;
      ball_y_velocity = 1;
      ball_speed = 3; 
    } else {
      cpu_score++;
      ball .attr('cx', 300) .attr('cy', 300);
      ball_x_velocity = 1;
      ball_y_velocity = 1; 
      ball_speed = 3;
    }
  });

  /**
   * Logic for updating the scoreboard. 
   * leftScore represents the cpu's score
   * rightScore represents the player's score
   */
  pongObservable
  .subscribe(() => {
    document.getElementById('leftScore')!.textContent=cpu_score.toString();
    document.getElementById('rightScore')!.textContent=player_score.toString();
  });

  /**
   * Logic for ball collision with player paddle.
   * Referenced from: https://gamedev.stackexchange.com/questions/4253/in-pong-how-do-you-calculate-the-balls-direction-when-it-bounces-off-the-paddl
   */
  pongObservable
  .map(() => ({ ballX: Number(ball.attr('cx')), ballY: Number(ball.attr('cy')), ballR: Number(ball.attr('r')),
                player: player }))
  .filter(({ ballX, ballY, ballR, player}) => ballX + ballR >= Number(player.attr('x')) 
   && ( (ballY - ballR <= Number(player.attr('y')) + Number(player.attr('height')) && ballY - ballR >= Number(player.attr('y'))) 
   || (ballY + ballR <= Number(player.attr('y')) + Number(player.attr('height')) && ballY + ballR >= Number(player.attr('y')) ) ) )
  .subscribe(({ ballY, ballR, player }) => {
    let 
      relativeIntersectY = Number(player.attr('y')) + (Number(player.attr('height'))/ 2) - ballY + ballR,
      normalizedRelativeIntersectionY = (relativeIntersectY / (Number(player.attr('height')) / 2)),
      bounceAngle = normalizedRelativeIntersectionY * MAXBOUNCEANGLE;
    ball_x_velocity = ball_speed * -Math.cos(bounceAngle);
    ball_y_velocity = ball_speed * -Math.sin(bounceAngle);
  });

  /**
   * Logic for ball collision with cpu paddle.
   * Referenced from: https://gamedev.stackexchange.com/questions/4253/in-pong-how-do-you-calculate-the-balls-direction-when-it-bounces-off-the-paddl
   */
  pongObservable
  .map(() => ({ ballX: Number(ball.attr('cx')), ballY: Number(ball.attr('cy')), ballR: Number(ball.attr('r')),
                cpu: cpu }))
  .filter(({ ballX, ballY, ballR, cpu}) => ballX - ballR <= Number(cpu.attr('x')) 
    && ( (ballY - ballR <= Number(cpu.attr('y')) + Number(cpu.attr('height')) && ballY - ballR >= Number(cpu.attr('y')))
    || (ballY + ballR <= Number(cpu.attr('y')) + Number(cpu.attr('height')) && ballY + ballR >= Number(cpu.attr('y'))) ) )
  .subscribe(({ ballY, ballR, cpu }) => {
    let
      relativeIntersectY = Number(cpu.attr('y'))+ (Number(cpu.attr('height')) / 2) - ballY + ballR,
      normalizedRelativeIntersectionY = (relativeIntersectY / (Number(cpu.attr('height')) / 2)),
      bounceAngle = normalizedRelativeIntersectionY * MAXBOUNCEANGLE;
    ball_x_velocity = ball_speed * Math.cos(bounceAngle);
    ball_y_velocity = ball_speed * -Math.sin(bounceAngle); 
  });

  /**
   * Logic for cpu paddle movement. Tracks the ball.
   * Referenced from: https://gamedev.stackexchange.com/questions/57352/imperfect-pong-ai 
   */
  pongObservable
  .map(() => (  {ballY: Number(ball.attr('cy')) }))
  .subscribe(({ ballY }) => { cpu.attr('y', ballY + ai_difficulty);
  });

  /**
   * Logic for moving the ball.
   * Ball moves at a certain speed in the x and y directions.
   */
  pongObservable
  .subscribe(() => {
    ball.attr('cx', ball_speed * ball_x_velocity + Number(ball.attr('cx')))
    ball.attr('cy', ball_speed * ball_y_velocity + Number(ball.attr('cy')))
  });

  /**
   * Logic for ball collision with ceiling or floor.
   * Simply reverses the y-direction of the ball.
   */
  pongObservable
  .map(() => ({ ballX: Number(ball.attr('cx')), ballY : Number(ball.attr('cy')), ballR: Number(ball.attr('r'))}))
  .filter(({ ballX, ballY, ballR }) => (ballY - ballR <= 0 || ballY + ballR >= 600) 
                                        && (ballX - ballR > 0 || ballX + ballR < 600))
  .subscribe(() => {
      ball_y_velocity *= -1;
  });

  /**
   * Logic for determining the winning paddle.
   */
  pongObservable
  .map(() => ({ playerScore: player_score, cpuScore: cpu_score }))
  .filter(({ playerScore, cpuScore}) => playerScore === best_of || cpuScore === best_of )
  .subscribe(() => {
    if (player_score === best_of) {
      player.attr('y', 250);
      cpu.attr('y', 250);
    } else if (cpu_score === best_of) { 
      player.attr('y', 250);
      cpu.attr('y', 250);
    }
    game_over = true;
  });

}

function playerPaddle() {
  /**
   * Creates the player paddle element and places it in the canvas element
   */
  const 
    svg = document.getElementById("canvas")!,
    rect = new Elem(svg, 'rect')
            .attr('x', 550) .attr('y', 250)
            .attr('width', 10) .attr('height', 100)
            .attr('fill', '#FFFFFF');

  return rect;
}

function cpuPaddle() {
  /**
   * Creates the cpu paddle element and places it in the canvas element
   */
  const
    svg = document.getElementById('canvas')!,
    rect = new Elem(svg, 'rect')
            .attr('x', 50) .attr('y', 50)
            .attr('width', 10) .attr('height', 100)
            .attr('fill', '#FFFFFF');

  return rect;
}

function pongBall() {
  /**
   * Creates the pong ball element and places it in the canvas element, in the middle
   */
  const 
    svg = document.getElementById("canvas")!,
    ball = new Elem(svg, 'circle')
            .attr('cx', 300) .attr('cy', 300)
            .attr('r', 5)
            .attr('fill', '#FFFFFF');
  
  return ball;
}

function middleLine() {
  /**
   * Creates the middle line separator and places it in the canvas element
   */
  const
    svg = document.getElementById('canvas')!,
    line = new Elem(svg, 'line')
                .attr('x1', 300) .attr('x2', 300)
                .attr('y1', 5) .attr('y2', 600)
                .attr('stroke', '#FFFFFF')
                .attr('stroke-width', 5)
                .attr('stroke-dasharray', 12)
  return line;
}

function displayScore(id: string, x: number, y: number) {
  /**
   * Creates score elements for player and CPU
   */
  const
    svg = document.getElementById('canvas')!,
    score = new Elem(svg, 'text')
                  .attr('id', id)
                  .attr('x', x)
                  .attr('y', y)
                  .attr('width', 30) .attr('height', 30)
                  .attr('fill', '#FFFFFF') .attr('font-size', "48px");

  return score;
}

// function displayInst() {
//   /**
//    * Displays instruction for player to start/restart a game. Can be set to not display
//    */
//   const
//     svg = document.getElementById('canvas')!,
//     inst = new Elem(svg, 'text')
//                   .attr('id', "inst")
//                   .attr('x', 300)
//                   .attr('y', 300)
//                   .attr('width', 200) .attr('height', 100)
//                   .attr('fill', '#FFFFFF') .attr('font-size', "48px");

//   return inst;
// }

// the following simply runs your pong function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    pong();
  }
