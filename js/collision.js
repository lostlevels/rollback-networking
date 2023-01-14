function collision(a, b) {
  if (!a || !b)
    return false;

  let aw = toFixed(a.width)
    , ah = toFixed(a.height)
    , ax = a.x
    , ay = a.y
    , bw = toFixed(b.width)
    , bh = toFixed(b.height)
    , bx = b.x
    , by = b.y

  return ax + aw > bx && ax < bx + bw &&
         ay + ah > by && ay < by + bh;
}

// Place entity on top of bottom.
function setOnTop(entity, bottom) {
  let top = getTop(bottom);
  let y = top - toFixed(entity.height);
  entity.y = y;
}

// Place entity on bottom of top.
function setOnBottom(entity, top) {
  let bottom = getBottom(top);
  let y = bottom;
  entity.y = y + toFixed(1);
  return;
}

// Place entity to right of left.
function setToRight(entity, left) {
  let right = getRight(left);
  let x = right;
  entity.x = x + toFixed(1);
}

// Place entity to left of right.
function setToLeft(entity, right) {
  let left = getLeft(right);
  let x = left - toFixed(entity.width);
  entity.x = x;
}

function getBottom(entity) {
  return entity.y + toFixed(entity.height);
}

function getTop(entity) {
  return entity.y;
}

function getRight(entity) {
    return entity.x + toFixed(entity.width);
}

function getLeft(entity) {
  return entity.x;
}

function above(a, b) {
  return a.y < b.y;
}

function below(a, b) {
  return a.y > b.y;
}

function wrapAroundScreen(entity, screenWidth) {
  let wrappedAround = false;
  if (entity.x < -toFixed(entity.width)) {
    entity.x = toFixed(screenWidth) + entity.x;
    wrappedAround = true;
  }
  if (entity.x >= toFixed(screenWidth)) {
    entity.x = entity.x - toFixed(screenWidth);
    wrappedAround = true;
  }
  return wrappedAround;
}