// route.ts

import { NextApiRequest, NextApiResponse } from 'next';

// GET handler for fetching note by ID
export const getNoteById = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.query;
    // Logic for getting a note from the database
    const note = await fetchNoteFromDatabase(id);
    if (!note) {
        return res.status(404).json({ message: 'Note not found' });
    }
    return res.status(200).json(note);
};

// PUT handler for updating a note by ID
export const updateNoteById = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.query;
    const noteData = req.body;
    // Logic for updating a note in the database
    const updatedNote = await updateNoteInDatabase(id, noteData);
    return res.status(200).json(updatedNote);
};

// DELETE handler for deleting a note by ID
export const deleteNoteById = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.query;
    // Logic for deleting a note from the database
    await deleteNoteFromDatabase(id);
    return res.status(204).send('');
};

// Export the handlers for use in your Next.js API routes
export default async (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case 'GET':
            return getNoteById(req, res);
        case 'PUT':
            return updateNoteById(req, res);
        case 'DELETE':
            return deleteNoteById(req, res);
        default:
            return res.status(405).json({ message: 'Method not allowed' });
    }
};