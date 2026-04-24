import styles from './DNAHelix.module.css';

export default function DNAHelix({ size = 120 }) {
  const strands = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className={styles.helix} style={{ width: size, height: size * 2.5 }}>
      <div className={styles.strand}>
        {strands.map(i => (
          <div key={i} className={styles.node} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={styles.dot} style={{ background: i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#00ff88' : '#8b5cf6' }} />
            <div className={styles.bridge} />
            <div className={styles.dot2} style={{ background: i % 3 === 0 ? '#8b5cf6' : i % 3 === 1 ? '#00d4ff' : '#00ff88' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
