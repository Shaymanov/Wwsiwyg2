<template>
    <div class="editorContainer">
      <div class="iconContainer">
        <button class="icons iconUndo" @click="undo" :disabled="!canUndo">
        </button>
        <button class="icons iconRedo" @click="redo" :disabled="!canRedo">
        </button>
        <button class="icons iconTitle" @click="formatSelectionTo('h1')">
        </button>
        <button class="icons iconPharagraph" @click="formatSelectionTo('p')">
        </button>
        <button class="icons iconImage" @click="addImage">
        </button>
          <p v-if="copied" class="copied">Скопировано!</p>
          <button
            v-else
            class="copy"
            @click="copyToHTML"
            :disabled="!canCopy"
          >
            Скопировать HTML
          </button>

          <p v-if="copied" class="copied">Скопировано!</p>
          <button
            v-else
            class="copy"
            @click="copyToBody"
            :disabled="!canCopy"
          >
            Скопировать Body
          </button>

      </div>
      <EditorContent :editor="editor" class="editorText"/>
    </div>
  </template>

<script lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, Editor } from '@tiptap/vue-3';
import { Image as TiptapImage } from '@tiptap/extension-image';

import * as change from './change';

export default {
  props: {
    initialContent: {
      type: String,
      default: ''
    }
  },

  setup(props) {
    const editor = ref<Editor | null>(null);
    const copied = ref(false);

    const canUndo = computed(() => {
      return editor.value ? editor.value.can().chain().focus().undo().run() : false;
    });

    const canRedo = computed(() => {
      return editor.value ? editor.value.can().chain().focus().redo().run() : false;
    });

    const canCopy = computed(() => {
      return !!editor.value?.getHTML();
    });

    const undo = () => {
      if (canUndo.value && editor.value) {
        editor.value.chain().focus().undo().run();
      }
    };

    const redo = () => {
      if (canRedo.value && editor.value) {
        editor.value.chain().focus().redo().run();
      }
    };

    const formatSelectionTo = (type: 'h1' | 'p') => {
      if (!editor.value) return;

      let formattedHTML = '';
      const selection = editor.value.state.selection;
      const selectionInSingleNode =
        selection.from >= selection.$from.start() && selection.to <= selection.$from.end();

      if (selectionInSingleNode) {
        const validSelection =
          selection && !selection.empty && editor.value.state.selection.$from.parent.textContent;

        if (validSelection) formattedHTML = change.formatInSingleNode(type, editor.value);
      } else {
        formattedHTML = change.formatInMultiNodes(type, editor.value);
      }

      if (formattedHTML) {
        editor.value
          .chain()
          .setTextSelection({ from: selection.$from.start(), to: selection.$to.end() })
          .deleteSelection()
          .insertContent(formattedHTML)
          .focus(selection.to + 2)
          .run();
      } else if (!editor.value.state.selection.$from.parent.textContent.length) {
        const command = type === 'h1' ? 'setHeading' : 'setParagraph';
        editor.value.chain().focus()[command]({ level: 1 }).run();
      } else {
        editor.value.chain().focus().run();
      }
    };

    const addImage = () => {
      const url = window.prompt('Укажите ссылку на изображение');

      if (url && editor.value) {
        const img = new Image();
        img.onload = () => {
          if (!editor.value) return;
          editor.value.chain().focus().setImage({ src: url }).run();
        };
        img.onerror = () => {
          alert('Ссылка на изображение неверна');
        };

        img.src = url;
      }
    };

    const copyToBody = () => {
      if (editor.value)
        navigator.clipboard.writeText(editor.value.getHTML()).then(() => {
          copied.value = true;
          setTimeout(() => {
            copied.value = false;
          }, 1000);
        });
    };

    const copyToHTML = () => {
      navigator.clipboard.writeText(document.documentElement.outerHTML).then(() => {
        copied.value = true;
        setTimeout(() => {
          copied.value = false;
        }, 1000);
      });
    };

    onMounted(() => {
      editor.value = new Editor({
        extensions: [
          StarterKit,
          TiptapImage,
        ],
        content: props.initialContent,
        editorProps: {
          attributes: {
            class: 'editor'
          }
        }
      });
      editor.value.chain().focus().run();
    });

    onBeforeUnmount(() => {
      if (editor.value) editor.value.destroy();
    });

    return {
      editor,
      copied,
      canUndo,
      canRedo,
      canCopy,
      undo,
      redo,
      formatSelectionTo,
      addImage,
      copyToBody,
      copyToHTML,
    };
  },

  components: {
    EditorContent,
  },
};
</script>

<style>

.editorText {
    text-align: justify;
}

.editorContainer {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 960px;
  padding: 70px 100px;
  margin: 0 auto;
}

.editor {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
}

.editor>p, .editor>h1 {
  max-width: 621px;
}

.iconContainer {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  gap: 12px;
  margin-left: 20px;
}

.icons {
    display: grid;
    place-items: center;
    height: 38px;
    width: 42px;
    background-color: #282828;
}

.copy {
  background-color: transparent;
  margin-left: 6px;
  margin-right: 6px;
  color: #639eff;

}

.copied {
  background-color: transparent;
  margin-left: 6px;
  margin-right: 6px;
  color: #639eff;
  line-height: 38px;
}

.iconUndo::before {
  content: url("../assets/icons/IconUndo.svg");
}

.iconRedo::before {
  content: url("../assets/icons/IconRedo.svg");
}

.iconTitle::before {
  content: url("../assets/icons/IconTitle.svg");
}

.iconPharagraph::before {
  content: url("../assets/icons/IconParagraph.svg");
}

.iconImage::before {
  content: url("../assets/icons/IconImage.svg");
}

@media (max-width: 768px) {
  .editorContainer {
    padding: 30px 10px;
  }
}

</style>
