import styles from '@/styles/loading.module.css';

//https://icons8.com/preloaders/ru/free#
export default function Loading() {
  return (
      <div className={styles.loading}>
          <svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="64px" height="64px" viewBox="0 0 128 128">
            <g>
                <circle cx="16" cy="64" r="16" fill="#49a7cc"/>
                <circle cx="16" cy="64" r="16" fill="#86c4dd" transform="rotate(45,64,64)"/>
                <circle cx="16" cy="64" r="16" fill="#b3daea" transform="rotate(90,64,64)"/>
                <circle cx="16" cy="64" r="16" fill="#dbedf5" transform="rotate(135,64,64)"/>
                <circle cx="16" cy="64" r="16" fill="#eaf5f9" transform="rotate(180,64,64)"/>
                <circle cx="16" cy="64" r="16" fill="#eaf5f9" transform="rotate(225,64,64)"/>
                <circle cx="16" cy="64" r="16" fill="#eaf5f9" transform="rotate(270,64,64)"/>
                <circle cx="16" cy="64" r="16" fill="#eaf5f9" transform="rotate(315,64,64)"/>
                <animateTransform attributeName="transform" type="rotate" values="0 64 64;315 64 64;270 64 64;225 64 64;180 64 64;135 64 64;90 64 64;45 64 64" calcMode="discrete" dur="720ms" repeatCount="indefinite"></animateTransform>
            </g>
        </svg>
      </div>
  );
}
