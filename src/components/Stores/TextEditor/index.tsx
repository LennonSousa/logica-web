import { useContext, useState, useEffect } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { FaFileWord } from 'react-icons/fa';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';

import { StoresContext } from '../../../contexts/StoresContext';
import api from '../../../api/api';
import { Store } from '..';
import { AlertMessage, statusModal } from '../../Interfaces/AlertMessage';


export type typeText = 'services_in' | 'warranty' | 'engineer' | 'bank_account';

interface WaitingModalProps {
    type: typeText;
    data: Store;
}

export default function TextEditor({ type, data }: WaitingModalProps) {
    const { handleStores } = useContext(StoresContext);

    const [title, setTitle] = useState("");

    const [editorState, setEditorState] = useState(() =>
        EditorState.createEmpty()
    );

    const updateTextDescription = (state: EditorState) => {
        setEditorState(state);
    };

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    useEffect(() => {
        if (data) {
            try {
                if (type === "services_in") {
                    setTitle("Serviçoes inclusos");

                    setEditorState(EditorState.createWithContent(convertFromRaw(JSON.parse(data.services_in))));
                }
                else if (type === "warranty") {
                    setTitle("Garantias");

                    setEditorState(EditorState.createWithContent(convertFromRaw(JSON.parse(data.warranty))));
                }
                else if (type === "engineer") {
                    setTitle("Engenheiro responsável");

                    setEditorState(EditorState.createWithContent(convertFromRaw(JSON.parse(data.engineer))));
                }
                else if (type === "bank_account") {
                    setTitle("Conta bancária");

                    setEditorState(EditorState.createWithContent(convertFromRaw(JSON.parse(data.bank_account))));
                }
            }
            catch {

            }
        }
    }, [data, type]);

    const handleSaveText = async (state: EditorState) => {
        if (data) {
            try {
                setTypeMessage("waiting");
                setMessageShow(true);

                const dataToSave = convertToRaw(state.getCurrentContent());

                await api.put(`stores/${data.id}`, {
                    title: data.title,
                    name: data.name,
                    city: data.city,
                    state: data.state,
                    document: data.document,
                    [type]: JSON.stringify(dataToSave),
                });

                const storesRes = await api.get('stores');

                handleStores(storesRes.data);

                setTypeMessage("success");

                setTimeout(() => {
                    setMessageShow(false);
                }, 1000);
            }
            catch (err) {
                setTypeMessage("error");

                setTimeout(() => {
                    setMessageShow(false);
                }, 4000);
            }
        }
    }

    return (
        <Row className="mt-3">
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

                <Row className="mb-2">
                    <Col>
                        <Editor
                            editorState={editorState}
                            toolbarClassName="toolbarClassName"
                            wrapperClassName="wrapperClassName"
                            editorClassName="editorClassName"
                            onEditorStateChange={updateTextDescription}
                        />
                    </Col>
                </Row>

                <Row className="justify-content-end">
                    {
                        messageShow ? <Col sm={3}><AlertMessage status={typeMessage} /></Col> :
                            <Col sm={1}>
                                <Button variant="success" onClick={() => handleSaveText(editorState)}>Salvar</Button>
                            </Col>

                    }
                </Row>
            </Col>
        </Row>
    )
}