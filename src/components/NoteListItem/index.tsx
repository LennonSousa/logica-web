import Link from 'next/link';
import { useRouter } from 'next/router';
import { Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';

import { Note } from '../Notes';
import { getHtml } from '../../utils/textEditor';

import styles from './styles.module.css';

interface NoteListItemProps {
    note: Note;
}

const NoteListItem: React.FC<NoteListItemProps> = ({ note }) => {
    const router = useRouter();

    function goToEdit() {
        router.push(`/notes/edit/${note.id}`);
    }

    return (
        <Col sm={4}>
            <Link href={`/notes/edit/${note.id}`}>
                <a>
                    <div className={styles.itemContainer}>
                        <Row className="align-items-center">
                            <Col sm={10}>
                                <h5 className={styles.itemTitle}>{note.title}</h5>
                            </Col>
                        </Row>

                        <Row>
                            <Col className={`${styles.textBox} block-with-text`}>
                                {
                                    note.text ? <span
                                        className={`form-control-plaintext text-secondary ${styles.itemText}`}
                                        dangerouslySetInnerHTML={{ __html: getHtml(note.text) }}
                                    >
                                    </span> :
                                        <>
                                            <br />
                                            <br />
                                            <br />
                                            <br />
                                        </>
                                }
                            </Col>
                        </Row>

                        <Row>
                            <Col>
                                <span className={`form-control-plaintext ${styles.itemDate}`}>
                                    {`${format(new Date(note.updated_at), 'dd/MM/yyyy')} - ${note.updated_by}`}
                                </span>
                            </Col>
                        </Row>
                    </div>
                </a>
            </Link>
        </Col >
    )
}

export default NoteListItem;