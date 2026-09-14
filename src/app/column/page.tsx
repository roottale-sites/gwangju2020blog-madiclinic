import MadiHeader from '../../components/madi/MadiHeader';

export const metadata = { title: '칼럼' };

export default function Page() {
  return (
    <>
      <MadiHeader pathname="/column" />
      <main id="main" style={{ paddingTop: 140 }}>
        <h2>칼럼</h2>
      </main>
    </>
  );
}
