export default function QuizCard({
  questions,
}: {
  questions: { question: string }[];
}) {
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div
          key={i}
          className="border rounded-xl p-4 bg-gray-50"
        >
          <p className="font-medium">
            {i + 1}. {q.question}
          </p>
        </div>
      ))}
    </div>
  );
}
