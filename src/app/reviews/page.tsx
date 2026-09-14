import MadiHeader from '../../components/madi/MadiHeader';

export const metadata = { title: '치료후기' };

export default function Page() {
  return (
    <>
      <MadiHeader pathname="/reviews" />
      <main id="main" style={{ paddingTop: 140 }}>
        <h2>치료후기</h2>
      </main>
    </>
  );
}
