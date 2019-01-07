export default function (body, query, next) {
  console.log('TEST FUNCTION CALLED')
  next('THIS IS THE RETURN')
}
