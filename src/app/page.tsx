import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.logo}>
          <Image
            src="/logo.png"
            alt="Heikō Logo"
            width={120}
            height={120}
            priority
          />
        </div>
        
        <h1 className={styles.title}>heikō</h1>
        
        <p className={styles.description}>
          Heikō is the Japanese word for balance, equilibrium. Ideally, this tool can
          <br />help with bringing balance to how we plan our days.
        </p>

        <Link href="/calendar" className={styles.button}>
          Let's begin
        </Link>
      </main>

      <footer className={styles.footer}>
        <p>no terms & agreement just yet lol</p>
      </footer>
    </div>
  );
}