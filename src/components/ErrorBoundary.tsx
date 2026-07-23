import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-shell">
          <div className="card">
            <h2>表示エラーが発生しました</h2>
            <p>
              保存されているデータの形式が原因で表示できませんでした。ブラウザの開発者ツールでエラー内容を確認するか、
              下記のボタンでこのアプリの保存データをリセットしてください(リセットすると入力内容・記録はすべて消えます)。
            </p>
            <p style={{ fontFamily: "monospace", fontSize: 13, whiteSpace: "pre-wrap" }}>
              {this.state.error.message}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              保存データをリセットして再読み込み
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
