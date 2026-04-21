"use client";
import dynamic from "next/dynamic";
import React, { Suspense } from "react";

const QuestionEditor = dynamic(
  () => import("../../../teacher/question-bank/create-question/page"),
  { ssr: false }
);

export default function ManageCreateQuestionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuestionEditor />
    </Suspense>
  );
}