class Follower {
  PVector loc, vel, acc; 

Follower(){
  loc = new PVector(random(width), random(height));
  vel= new PVector();
  acc= new PVector();
}

void render(){
  //fill(acc.mag() * 500,255,255); 
  fill(0);
  noStroke();
  ellipse(loc.x,loc.y,2,2);
}

void update(){
  acc = new PVector(mouseX-loc.x, mouseY -loc.y); 
  acc.limit(.5);
  vel.add(acc);
  vel.limit(10);
  loc.add(vel);
}
}

Follower [] follower = new Follower[200];

void setup(){
  size(360,800);
    background(255);
  for( int i =0; i < follower.length; i++){
    follower[i] = new Follower();
  }
}

void draw(){

  fill(255,255,255,30);
  rect(0,0,360,800);
  for( int i =0; i < follower.length; i++){
    follower[i].update(); 
        follower[i].render(); 

  } 
}