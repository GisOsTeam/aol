function XMLSerializer() {
}

XMLSerializer.prototype.serializeToString = function (node) {
  if (!node) {
    return '';
  }
  // Fix a jsdom issue where all SVG tagNames are lowercased:
  // https://github.com/tmpvar/jsdom/issues/620
  var text = node.outerHTML;
  var tagNames = ['linearGradient', 'radialGradient', 'clipPath', 'textPath'];
  for (var i = 0, l = tagNames.length; i < l; i++) {
    var tagName = tagNames[i];
    text = text.replace(
      new RegExp('(<|</)' + tagName.toLowerCase() + '\\b', 'g'),
      function (match, start) {
        return start + tagName;
      }
    );
  }
  return text;
};
global.XMLSerializer = XMLSerializer;
