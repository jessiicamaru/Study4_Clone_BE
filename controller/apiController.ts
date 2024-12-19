import pool from '../config/connectDB';
import express from 'express';
import sql from 'mysql2';
import { GeneralTestReturnedInformation, Question, QuestionProps, User } from '../props/props';

const getLevelTest = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { subject, name, phone, city } = req.query;

    console.log({ subject, name, phone, city });

    try {
        if (subject === 'BasicEnglish') {
            const [examRows] = await pool.execute('SELECT * FROM exam WHERE Hastags = ?', [subject]);
            const examResult = examRows as sql.RowDataPacket[];

            if (examResult.length === 0) {
                res.status(404).json({ message: 'Không tìm thấy bài kiểm tra nào.' });
                return;
            }

            const { ExamID, Title, MaxScore, TimeOfExam, NumberOfQuestion, Parts } = examResult[0];

            const returnData: GeneralTestReturnedInformation = {
                ExamID,
                ExamTitle: Title,
                ExamMaxScore: MaxScore,
                TimeOfExam,
                NumberOfQuestion,
                Parts,
                Question: [],
            };

            const [questionAndAnswerRows] = await pool.execute(
                `
                SELECT q.QuestionID, q.Question, q.QuestionType, q.AudioPath, q.ImagePath, q.OrderNumber,
                       a.AnswerID, a.Answer, a.AnswerValue, a.IsCorrect
                FROM question q
                LEFT JOIN answer a ON q.QuestionID = a.QuestionID
                WHERE q.ExamID = ?
                `,
                [ExamID]
            );

            const rows = questionAndAnswerRows as sql.RowDataPacket[];

            const questionMap = new Map<string, Question>();

            rows.forEach((row) => {
                if (!questionMap.has(row.QuestionID)) {
                    questionMap.set(row.QuestionID, {
                        QuestionID: row.QuestionID,
                        Question: row.Question,
                        QuestionType: row.QuestionType,
                        AudioPath: row.AudioPath,
                        ImagePath: row.ImagePath,
                        OrderNumber: row.OrderNumber,
                        Answer: [],
                    });
                }

                if (row.AnswerID) {
                    questionMap.get(row.QuestionID)?.Answer.push({
                        AnswerID: row.AnswerID,
                        QuestionID: row.QuestionID,
                        Answer: row.Answer,
                        AnswerValue: row.AnswerValue,
                        IsCorrect: row.IsCorrect,
                    });
                }
            });

            returnData.Question = Array.from(questionMap.values());

            res.status(200).json(returnData);
            return;
        }
    } catch (error) {
        next(error);
    }
};

const getScore = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { answer, info, time }: { answer: QuestionProps[]; info: User; time: string } = req.body.data;

        console.log({ answer, info, time });

        const grade = answer.map((i) => i.correctAnswer).length;

        let message = '';

        if (grade < 10) message = 'A1 - A2';
        else if (grade < 15) message = 'B1 - B2';
        else message = 'C1 - C2';

        res.status(200).json({
            message: 'ok',
        });
    } catch (error) {
        next(error);
    }
};

export { getLevelTest, getScore };
