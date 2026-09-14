import type { ReviewFaqItem } from './review-faq';

type ReviewFaqProps = Readonly<{
  items: readonly ReviewFaqItem[];
}>;

export default function ReviewFaq({ items }: ReviewFaqProps) {
  if (items.length === 0) return null;

  return (
    <section className="review-detail__faq" aria-labelledby="review-faq-title">
      <header className="review-detail__faq-heading">
        <p aria-hidden="true">FAQ</p>
        <h2 id="review-faq-title">자주 묻는 질문</h2>
      </header>
      <ul>
        {items.map((item, index) => (
          <li key={item.question}>
            <details open={index === 0}>
              <summary>
                <h3>{item.question}</h3>
                <span aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
