import React, { useEffect, useImperativeHandle, forwardRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import MathExtension from "tiptap-math"
import "katex/dist/katex.min.css"

interface TiptapMathEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  renderMathButton?: () => React.ReactNode // Optional render prop for floating button
}

export const TiptapMathEditor = forwardRef<any, TiptapMathEditorProps>(({ value, onChange, placeholder, renderMathButton }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder || "Nhập câu hỏi" }),
      MathExtension.configure({
        // KaTeX options
        katexOptions: { throwOnError: false },
        inlineMath: true,
        blockMath: true,
      }),
    ],
    content: value,
    autofocus: true, // Tự động focus editor khi mount
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "min-h-[120px] rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-transparent text-white",
      },
    },
  })

  useImperativeHandle(ref, () => editor ? {
    ...editor,
    insertLatexInline: (latex: string) => {
      // Insert inline math node using tiptap-math
      if (!editor) return false;
      // Insert as inline math node
      return editor.chain().focus().insertContent({
        type: 'math',
        attrs: { showRendered: true },
        content: [{ type: 'text', text: latex }]
      }).run();
    }
  } : null, [editor])

  useEffect(() => {
    if (
      editor &&
      value !== editor.getHTML() &&
      value !== editor.getText() // So sánh cả HTML và plain text để tránh setContent không cần thiết
    ) {
      editor.commands.setContent(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before,
        .ProseMirror.is-editor-empty::before {
          color: #fff;
          opacity: 0.7;
          content: attr(data-placeholder);
          pointer-events: none;
          height: 0;
        }
      `}</style>
      <EditorContent editor={editor} spellCheck={false} style={{ flex: 1 }} />
      {renderMathButton && (
        <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 10 }}>
          {renderMathButton()}
        </div>
      )}
    </div>
  )
})
