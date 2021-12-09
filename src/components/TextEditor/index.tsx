import { useState, useEffect } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { FaPencilAlt, FaFileWord } from 'react-icons/fa';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';

import { getHtml } from '../../utils/textEditor';

interface TextEditorProps {
    title: string;
    text: string;
    canEdit: boolean;
    handleSaveText?: (textToSave: string) => void;
}

export default function TextEditor({ title, text, canEdit, handleSaveText }: TextEditorProps) {
    const [editorState, setEditorState] = useState(() =>
        EditorState.createEmpty()
    );

    const [textView, setTextView] = useState('');

    const [isEditing, setIsEditing] = useState(false);

    const updateTextDescription = (state: EditorState) => {
        setEditorState(state);
    };

    useEffect(() => {
        try {
            setTextView(text);

            setEditorState(EditorState.createWithContent(convertFromRaw(JSON.parse(text))));
        }
        catch {

        }
    }, [text]);

    const handleText = async (state: EditorState) => {
        try {
            const dataToSave = convertToRaw(state.getCurrentContent());

            if (handleSaveText) handleSaveText(JSON.stringify(dataToSave));

            setTextView(JSON.stringify(dataToSave));

            setIsEditing(false);
        }
        catch {
        }
    }

    return (
        <Row className="mt-3 mb-3">
            <Col>
                <Row>
                    <Col className="border-top mt-3 mb-5"></Col>
                </Row>

                <Row className="mb-3">
                    <Col>
                        <Row>
                            <Col>
                                <h6 className="text-success">{title} <FaFileWord /></h6>
                            </Col>
                        </Row>
                    </Col>
                </Row>

                {
                    isEditing ? <Row className="mb-2">
                        <Col className="border rounded">
                            <Editor
                                editorState={editorState}
                                toolbarClassName="toolbarClassName"
                                wrapperClassName="wrapperClassName"
                                editorClassName="editorClassName"
                                onEditorStateChange={updateTextDescription}
                            />
                        </Col>
                    </Row> :
                        <Row className="mb-3">
                            <Col>
                                <span
                                    className="text-secondary text-wrap"
                                    dangerouslySetInnerHTML={{ __html: getHtml(textView) }}
                                ></span>
                            </Col>
                        </Row>
                }

                {
                    canEdit && <Row className="justify-content-end">
                        {
                            isEditing ? <>
                                <Col className="col-row">
                                    <Button
                                        variant="success"
                                        onClick={() => handleText(editorState)}
                                    >
                                        Aplicar
                                    </Button>
                                </Col>

                                <Col className="col-row">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancelar
                                    </Button>
                                </Col>
                            </> :
                                <Col className="col-row">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsEditing(true)}
                                        title="Editar anotação"
                                    >
                                        <FaPencilAlt />
                                    </Button>
                                </Col>
                        }

                    </Row>
                }
            </Col>
        </Row>
    )
}