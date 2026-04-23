import mongoose, { Schema, Document, Model } from "mongoose";

export type QuizStatus = "INACTIVE" | "ACTIVE" | "PUBLISHED";

export interface IQuizQuestion {
    text: string;
    options: string[];
    correctOption: number;
    points: number;
}

export interface IQuiz extends Document {
    title: string;
    instructions: string[];
    price: number;
    prizeMoney: number;
    firstPrize: number;
    secondPrize: number;
    thirdPrize: number;
    currency: string;
    status: QuizStatus;
    questions: IQuizQuestion[];
    createdBy: string;
    createdByName: string;
    createdByEmail: string;
    participantCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
    {
        text:          { type: String, required: true, trim: true },
        options:       { type: [String], required: true },
        correctOption: { type: Number, required: true, min: 0 },
        points:        { type: Number, default: 1, min: 1 },
    },
    { _id: false }
);

const QuizSchema: Schema<IQuiz> = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        instructions: {
            type: [String],
            default: [],
        },
        price: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        prizeMoney: {
            type: Number,
            min: 0,
            default: 0,
        },
        firstPrize: {
            type: Number,
            min: 0,
            default: 0,
        },
        secondPrize: {
            type: Number,
            min: 0,
            default: 0,
        },
        thirdPrize: {
            type: Number,
            min: 0,
            default: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["INACTIVE", "ACTIVE", "PUBLISHED"],
            default: "INACTIVE",
            index: true,
        },
        questions: {
            type: [QuizQuestionSchema],
            default: [],
        },
        createdBy: {
            type: String,
            required: true,
            index: true,
        },
        createdByName: {
            type: String,
            required: true,
        },
        createdByEmail: {
            type: String,
            required: true,
            index: true,
        },
        participantCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true }
);

const Quiz: Model<IQuiz> =
    mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);

export default Quiz;
