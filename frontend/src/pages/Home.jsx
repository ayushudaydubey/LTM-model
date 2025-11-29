import styles from './Home.module.css'
import { Link } from 'react-router-dom'

export default function Home() {
	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Welcome</h1>
			<p className={styles.lead}>This is the Home page of your app.</p>
			<div className={styles.actions}>
				<Link to="/login" className={styles.button}>Login</Link>
				<Link to="/register" className={styles.buttonSecondary}>Register</Link>
			</div>
		</div>
	)
}
