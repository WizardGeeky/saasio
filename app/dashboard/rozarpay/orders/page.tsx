"use client";

import React, { useState } from "react";
import CheckoutButton, { PaymentSuccessData } from "@/components/checkout-button";
import { FiCheckCircle, FiCreditCard } from "react-icons/fi";

export default function CreateOrderPage() {
    const [amount, setAmount] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [lastPayment, setLastPayment] = useState<PaymentSuccessData | null>(null);

    const parsedAmount = parseFloat(amount);
    const isValid = !isNaN(parsedAmount) && parsedAmount > 0;

    return (
        <div className="max-w-lg mx-auto mt-8 px-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
                        <FiCreditCard size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Create Order</h1>
                        <p className="text-sm text-slate-500">Enter amount and initiate a Razorpay payment</p>
                    </div>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-5">
                    {/* Amount */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            Amount <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                            <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                        </div>
                        {amount && !isValid && (
                            <p className="text-xs text-red-500">Enter a valid amount greater than 0</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Pro Plan – Monthly"
                            className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                    </div>

                    {/* Pay button */}
                    <CheckoutButton
                        amount={isValid ? parsedAmount : 0}
                        description={description}
                        productName="SAASIO"
                        disabled={!isValid}
                        className="w-full justify-center py-3"
                        onSuccess={(data) => {
                            setLastPayment(data);
                            setAmount("");
                            setDescription("");
                        }}
                    />
                </div>
            </div>

            {/* Success card */}
            {lastPayment && (
                <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <FiCheckCircle className="text-emerald-600 shrink-0" size={20} />
                        <h2 className="text-base font-semibold text-emerald-800">Payment Successful</h2>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-slate-500">Payment ID</dt>
                        <dd className="font-medium text-slate-800 truncate">{lastPayment.paymentId}</dd>

                        <dt className="text-slate-500">Order ID</dt>
                        <dd className="font-medium text-slate-800 truncate">{lastPayment.orderId}</dd>

                        <dt className="text-slate-500">Amount</dt>
                        <dd className="font-medium text-slate-800">
                            ₹{(lastPayment.amount / 100).toLocaleString("en-IN")} {lastPayment.currency}
                        </dd>

                        <dt className="text-slate-500">Paid by</dt>
                        <dd className="font-medium text-slate-800 truncate">{lastPayment.userEmail}</dd>

                        <dt className="text-slate-500">Name</dt>
                        <dd className="font-medium text-slate-800">{lastPayment.userName}</dd>

                        {lastPayment.description && (
                            <>
                                <dt className="text-slate-500">Description</dt>
                                <dd className="font-medium text-slate-800">{lastPayment.description}</dd>
                            </>
                        )}

                        <dt className="text-slate-500">Paid at</dt>
                        <dd className="font-medium text-slate-800">
                            {new Date(lastPayment.paidAt).toLocaleString("en-IN")}
                        </dd>
                    </dl>
                </div>
            )}
        </div>
    );
}
