import draftToHtml from 'draftjs-to-html';
import { convertFromRaw, convertToRaw, EditorState } from 'draft-js';

function getHtml(rawText: string) {
    try {
        const rawContent = convertFromRaw(JSON.parse(rawText));

        const content: EditorState = EditorState.createWithContent(rawContent);

        return draftToHtml(convertToRaw(content.getCurrentContent()));
    }
    catch {
        return rawText;
    }
}

export { getHtml };