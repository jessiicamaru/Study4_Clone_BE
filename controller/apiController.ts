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
                SELECT 
                    q.QuestionID, 
                    q.Question, 
                    q.QuestionType, 
                    q.AudioPath, 
                    q.ImagePath, 
                    q.OrderNumber,
                    a.AnswerID, 
                    a.Answer, 
                    a.AnswerValue, 
                    a.IsCorrect,
                    p.PartOrder
                FROM 
                    question q
                LEFT JOIN 
                    answer a ON q.QuestionID = a.QuestionID
                INNER JOIN 
                    part p ON q.PartID = p.PartID
                WHERE 
                    p.ExamID = ?
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
                        PartOrder: row.PartOrder,
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
    function timeDifference(time1: string, time2: string) {
        const toMinutes = (time: string) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const diffMinutes = toMinutes(time1) - toMinutes(time2);

        const hours = Math.floor(Math.abs(diffMinutes) / 60);
        const minutes = Math.abs(diffMinutes) % 60;

        return `${diffMinutes < 0 ? '-' : ''}${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    }

    const returnFeedback = [
        {
            result: 'Dựa vào kết quả bài kiểm tra, trình độ tiếng Anh của bạn là English Basic User (từ A1 - Beginner đến A2 - Elementary) theo chuẩn CEFR (Khung tham chiếu trình độ ngôn ngữ chung Châu Âu)',
            comment: [
                '• Trình độ Anh ngữ A1 là đủ cho các tương tác rất đơn giản, chẳng hạn như khi đi du lịch tại một quốc gia nói tiếng Anh. Trình độ A1 là không đủ cho các mục đích học thuật hoặc chuyên môn khác.',
                '• Trình độ Anh ngữ A2 là đủ để đi du lịch tại một nước nói tiếng Anh và giao lưu với những người nói tiếng Anh, tuy nhiên để phát triển tình bạn sâu sắc hơn thì trình độ A2 là không đủ. Trình độ Anh ngữ A2 cũng giúp bạn có thể giao lưu với các đồng nghiệp nói tiếng Anh, nhưng làm việc bằng tiếng Anh chỉ giới hạn ở những chủ đề rất quen thuộc ở trình độ này. Trình độ Anh ngữ A2 là không đủ để nghiên cứu học thuật hay sử dụng hầu hết phương tiện truyền thông bằng tiếng Anh (ti vi phim ảnh, đài phát thanh, tạp chí,....)',
            ],
        },

        {
            result: 'Dựa vào kết quả bài kiểm tra, trình độ tiếng Anh của bạn English Independent User (từ B1 - Intermediate đến B2 - Upper Intermediate) theo chuẩn CEFR (Khung tham chiếu trình độ ngôn ngữ chung của Châu Âu)',
            comment: [
                '• Trình độ Anh ngữ B1 là đủ để tương tác về các chủ đề quen thuộc với những người nói tiếng Anh. Ở nơi làm việc, những người có trình độ Anh ngữ B1 có thể đọc các báo cáo đơn giản về những chủ đề quen thuộc và soạn email đơn giản về các chủ đề trong lĩnh vực của họ. Tuy nhiên trình độ B1 là không đủ để làm việc hoàn toàn bằng tiếng Anh.',
                '• Trình độ Anh ngữ B2 sẽ cho phép bạn hoạt động tại nơi làm việc bằng tiếng Anh, và trên thực tế nhiều người nói tiếng Anh không phải bản xứ trong môi trường làm việc quốc tế ở trình độ này. Tuy nhiên một người làm việc bằng tiếng Anh ở trình độ B2 sẽ thiểu khả năng thể hiện các sắc thái ở bên ngoài lĩnh vực của mình. Anh ta cũng có thể bỏ lỡ một số sắc thái tinh tế và hàm ý trong hội thoại.',
            ],
        },

        {
            result: 'Dựa vào kết quả bài kiểm tra, trình độ tiếng Anh của bạn là Proficient English User (từ C1 - Advanced đến C2 - Proficiency) theo chuẩn CEFR (Khung tham chiếu trình độ ngôn ngữ chung của Châu Âu)',
            comment: [
                '• Trình độ Anh ngữ C1 cho phép thực hiện đầy đủ các năng lực trong công việc hay trong một môi trường học thuật. Trình độ C1 sẽ cho phép bạn hoàn toàn tự chủ tại một nước nổi tiếng Anh bản ngữ.',
                '• Trình độ Anh ngữ C2 về cơ bản là mức độ bản ngữ. Nó cho phép đọc và viết mọi loại văn bản thuộc bất kỳ chủ đề nào cũng như biểu đạt cảm xúc và ý kiến kèm sắc thái, và cho phép tham gia tích cực trong mọi môi trường học thuật hay công việc.',
            ],
        },
    ];

    try {
        const {
            answer,
            info,
            time,
            timeOfExam,
            maxScore,
        }: { answer: QuestionProps[]; info: User; time: string; timeOfExam: string; maxScore: string } = req.body.data;

        // await pool.query('INSERT INTO tempuser(UserID, Name, Phone, City, Subject) VALUES (UUID(), ?, ?, ?, ?)', [
        //     info.name,
        //     info.phone,
        //     info.city,
        //     info.subject,
        // ]);

        const grade = answer.filter((i) => {
            return i.correctAnswer == i.choosenAnswer;
        });

        let message = {
            result: '',
            comment: ['', ''],
        };

        if (grade.length < 12) message = returnFeedback[0];
        else if (grade.length < 18) message = returnFeedback[1];
        else message = returnFeedback[2];

        res.status(200).json({
            message,
            answer,
            grade: grade.length + '/' + maxScore,
            timeToFinish: timeDifference(timeOfExam + ':00', time),
        });
    } catch (error) {
        next(error);
    }
};

export { getLevelTest, getScore };
