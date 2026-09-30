import Image from 'next/image';

export default function ColumnConsultationPhoto() {
  return (
    <Image
      className="column-consultation-photo"
      src="/madi/img/clinic-consultation.webp"
      alt="마디클리닉 진료실에서 척추 모형으로 환자에게 설명하는 의료진"
      width={2400}
      height={1600}
      sizes="(max-width: 1200px) 100vw, 1200px"
    />
  );
}
