import { Node } from '@tiptap/pm/model';
import { Editor } from '@tiptap/vue-3';

export function formatInSingleNode(toType: 'h1' | 'p', editor: Editor): string {
  const { from, to } = editor.state.selection;
  const nodeStart = editor.state.selection.$from.start();
  const parentNode = editor.state.selection.$from.parent;

  const textBefore = parentNode.textBetween(0, from - nodeStart);
  const highlighted = parentNode.textBetween(from - nodeStart, to - nodeStart);
  const textAfter = parentNode.textBetween(to - nodeStart, parentNode.content.size);

  const fromType = editor.state.doc.resolve(from).parent.type.name === 'heading' ? 'h1' : 'p';

  let change = '';
  if (textBefore) {
    change += `<${fromType}>${textBefore}</${fromType}>`;
  }
  change += `<${toType}>${highlighted}</${toType}>`;
  if (textAfter) {
    change += `<${fromType}>${textAfter}</${fromType}>`;
  }

  return change;
}

export function formatInMultiNodes(type: 'h1' | 'p', editor: Editor): string {
  const state = editor.state;
  const { from, to } = state.selection;

  const startNode = state.doc.nodeAt(from);
  const endNode = state.doc.nodeAt(to - 1);

  let change = '';

  state.doc.nodesBetween(from, to, (node: Node) => {

    if (node.type.name !== 'text') {
      // Обработка начального узла.
      if (startNode && (node === startNode || node.firstChild === startNode)) {
        const beforeSelection = startNode.text?.slice(0, from - state.selection.$from.start());
        const selection = startNode.text?.slice(
          from - state.selection.$from.start(),
          state.selection.$from.end()
        );
        const tag = state.doc.resolve(from).parent.type.name === 'heading' ? 'h1' : 'p';

        if (beforeSelection) {
          change += `<${tag}>${beforeSelection}</${tag}>`;
        }
        if (selection) {
          change += `<${type}>${selection}`;
        }
      }

      else if (endNode && (node === endNode || node.firstChild === endNode)) {
        const selection = endNode.text?.slice(0, to - state.selection.$to.start());
        const afterSelection = endNode.text?.slice(
          to - state.selection.$to.start(),
          state.selection.$to.end()
        );
        const tag = state.doc.resolve(to).parent.type.name === 'heading' ? 'h1' : 'p';

        if (selection) {
          change += `${selection}</${type}>`;
        }
        if (afterSelection) {
          change += `<${tag}>${afterSelection}</${tag}>`;
        }
      }

      else if (node.type.name === 'image') {
        change += `</${type}><img src="${node.attrs.src}" /><${type}>`;
      } else if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        change += node.textContent;
      }
    }
  });

  return change;
}