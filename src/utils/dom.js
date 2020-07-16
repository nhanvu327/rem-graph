export function stripHtml(html) {
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function convertStringToHtml(string) {
  // var wrapper = document.createElement('div');
  // wrapper.innerHTML = ;
  // return wrapper.firstChild;
  var parser = new DOMParser();
  var doc = parser.parseFromString(`<div>${string}</div>`, 'text/html');
  return doc.body.firstChild;
}
