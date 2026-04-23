import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuizAnswer {
    questionIndex: number;
    selectedOption: number;
}

export interface IQuizParticipation extends Document {
    quizId: string;
    quizTitle: string;
    userId: string;
    userName: string;
    userEmail: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    timeTakenSeconds: number;
    answers: IQuizAnswer[];
    createdAt: Date;
    updatedAt: Date;
}

const QuizAnswerSchema = new Schema<IQuizAnswer>(
    {
        questionIndex:  { type: Number, required: true },
        selectedOption: { type: Number, required: true },
    },
    { _id: false }
);

const QuizParticipationSchema: Schema<IQuizParticipation> = new Schema(
    {
        quizId: {
            type: String,
            required: true,
            index: true,
        },
        quizTitle: {
            type: String,
            required: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        userName: {
            type: String,
            required: true,
        },
        userEmail: {
            type: String,
            required: true,
            index: true,
        },
        score: {
            type: Number,
            required: true,
            min: 0,
        },
        totalQuestions: {
            type: Number,
            required: true,
            min: 0,
        },
        percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        timeTakenSeconds: {
            type: Number,
            min: 0,
            default: 0,
        },
        answers: {
            type: [QuizAnswerSchema],
            default: [],
        },
    },
    { timestamps: true }
);

const QuizParticipation: Model<IQuizParticipation> =
    mongoose.models.QuizParticipation ||
    mongoose.model<IQuizParticipation>("QuizParticipation", QuizParticipationSchema);

export default QuizParticipation;
