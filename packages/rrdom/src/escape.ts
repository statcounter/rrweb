// for serializing a virtual DOM to html

export function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/ /g, '&nbsp;') // unicode version is correct, but output the html escape syntax for consistency with what chrome outputs
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeHtmlAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/ /g, '&nbsp;') // unicode version is correct, but output the html escape syntax for consistency with what chrome outputs
    .replace(/"/g, '&quot;');
}
