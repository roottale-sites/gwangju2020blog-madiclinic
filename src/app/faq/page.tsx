import MadiHeader from '../../components/madi/MadiHeader';

export const metadata = { title: '자주 묻는 질문' };

export default function Page() {
  return (
    <>
      <MadiHeader pathname="/faq" />
      <main id="main" style={{ paddingTop: 140 }}>
        <h2>자주 묻는 질문</h2>
      </main>
    </>
  );
}
