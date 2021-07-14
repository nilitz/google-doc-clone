import React, {useEffect, useRef, useCallback, useState} from 'react';
import Quill from "quill";
import "quill/dist/quill.snow.css"
import { io } from 'socket.io-client'
import { useParams } from "react-router-dom"

const SAVE_INTERVAL_MS = 2000

const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
]

export default function TextEditor() {
    const {id: documentId} = useParams()
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState()

    // Connect to the socket
    useEffect(() => {
        const s = io('http://localhost:3001')
        setSocket(s)
        return () => {s.disconnect()}
    }, [])

    // Connect to a room
    useEffect(() => {
        if (socket ==  null || quill == null) return

        socket.once('load-document', document => {
            quill.setContents(document)
            quill.enable()
            console.log('test 1.5')
        })


        socket.emit('get-document', documentId)


    }, [socket, quill, documentId])

    // When Quill changes
    useEffect(() => {
        if (socket ==  null || quill == null) return

        const handler = function (delta, oldDelta, source) {
            if (source !== 'user') return
            socket.emit("send-changes", delta)
        }

        quill.on('text-change', handler)

        return () => {quill.off('text-change', handler)}
    }, [socket, quill])

    // When another user update his document
    useEffect(() => {
        if (socket ==  null || quill == null) return

        const handler = function (delta) {quill.updateContents(delta)}

        socket.on('receive-changes', handler)

        return () => {quill.off('receive-changes', handler)}
    }, [socket, quill])

    // Save changes
    useEffect(() => {
        if (socket ==  null || quill == null) return

        const interval = setInterval(() => {
            socket.emit('save-document', quill.getContents())
        }, SAVE_INTERVAL_MS)


        return () => {clearInterval(interval)}
    }, [socket, quill])


    // Load Quill
    const wrapperRef = useCallback(wrapper => {
        if (wrapper == null) return;
        wrapper.innerHTML = ""
        const editor = document.createElement('div')
        wrapper.append(editor)
        const q = new Quill(editor, {theme: 'snow', modules: {toolbar: TOOLBAR_OPTIONS}})

        q.disable()
        q.setText("Loading ...")
        setQuill(q)
    }, [])

    return (
        <div className={"container"} ref={wrapperRef}>

        </div>
    )
}
