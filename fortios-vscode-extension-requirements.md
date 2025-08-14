# FortiOS VS Code Extension - MVP Requirements

## プロジェクト概要

FortiOS設定ファイルの編集を効率化するVS Code拡張機能。ネットワークエンジニアの日常業務を支援し、設定作業の生産性を向上させることを目的とする。

## 対象ファイル

- `.conf` - FortiOS設定ファイル
- `.cfg` - FortiOS設定ファイル（代替拡張子）
- その他FortiOS設定関連ファイル

## Tier 1: 基本機能（MVP）

### 1. 強化されたシンタックス機能

#### 1.1 設定ブロックの折りたたみ

- **要件**: `config` ～ `end` ブロックの折りたたみ機能
- **対象パターン**:

  ```fortios
  config system global
      set hostname "FortiGate-01"
      set timezone "Asia/Tokyo"
  end
  ```

- **実装方式**: Language Configuration JSON + FoldingRangeProvider
- **動作**:
  - `config`行の左側に折りたたみアイコン表示
  - ワンクリックでブロック全体を折りたたみ/展開
  - ネストしたconfigブロックにも対応

#### 1.2 インデントガイドライン

- **要件**: 設定ブロック内の階層構造を視覚的に表示
- **表示対象**:
  - `config` ～ `end` ブロック
  - `edit` ～ `next` ブロック
- **視覚効果**: 垂直線でインデントレベルを表示

#### 1.3 括弧・ブロックマッチング

- **要件**: 対応するブロック開始/終了の強調表示
- **対象パターン**:
  - `config` ↔ `end`
  - `edit` ↔ `next`
  - `"` ↔ `"` (文字列)
- **動作**: カーソルが該当キーワードにある時、対応するペアをハイライト

#### 1.4 コメント切り替え

- **要件**: 行コメントの自動挿入/削除
- **FortiOS形式**: `#` で始まる行コメント
- **Cisco ASA形式**: `!` で始まる行コメント
- **ショートカット**: `Ctrl+/` (Windows/Linux), `Cmd+/` (Mac)
- **動作**:
  - 単一行: 行頭に `#` を追加/削除
  - 複数行選択: 選択した全行に対して適用

### 2. 構造化機能

#### 2.1 構造化されたOutline表示

- **要件**: 設定ファイルの階層構造をツリー形式で表示
- **実装方式**: DocumentSymbolProvider + TreeView
- **表示階層**:

  ```
  📁 System Configuration
    ├── 🔧 Global Settings
    ├── 🌐 Interface Configuration
    └── 👥 Administrator Settings
  📁 Security Configuration  
    ├── 🛡️ Firewall Policies
    ├── 🏠 Address Objects
    └── 🔐 Service Objects
  📁 Network Configuration
    ├── 🛣️ Static Routes
    └── 🔄 DHCP Settings
  ```

- **機能**:
  - クリックで該当行にジャンプ
  - アイコンで設定種別を識別
  - 折りたたみ/展開による表示制御

#### 2.2 設定要約の自動抽出

- **要件**: 設定ファイルから重要情報を自動抽出・表示
- **抽出情報**:

| 項目 | 抽出ソース | 表示例 |
|------|-----------|--------|
| FortiOSバージョン | `#config-version=` | `FortiOS 7.4.0` |
| 機器名 | `set hostname` | `"FortiGate-Tokyo-01"` |
| シリアル番号 | `#Serial-Number:` | `FGT60E-XXXXXXXXXX` |
| 外部通信設定 | NAT/Policy設定 | `🟡 External access enabled` |
| インターフェース数 | interface config | `🔌 8 interfaces configured` |
| ポリシー数 | firewall policy | `🛡️ 15 policies defined` |

- **表示方式**:
  - WebViewパネルで要約情報を表示
  - 色分けによるリスク表示（緑：安全、黄：注意、赤：危険）
  - コマンドパレットからアクセス可能

#### 2.3 コンテキスト認識補完

- **要件**: 前述の2.1と統合した高度な補完機能
- **補完トリガー**:
  - スペース入力時
  - `set` 入力後
  - `edit` 入力後
- **補完内容の優先度**:
  1. 現在のコンテキストで有効なコマンド
  2. 過去の使用履歴ß
  3. 一般的な設定パターン
- **表示形式**: 説明付きの補完候補リスト

## 技術要件

### 開発環境

- **プラットフォーム**: VS Code Extension API
- **言語**: TypeScript
- **ビルドツール**: webpack, esbuild
- **テストフレームワーク**: Mocha

### パフォーマンス要件

- **ファイル解析時間**: 1MB以下のファイルで1秒以内
- **補完応答時間**: 200ms以内
- **メモリ使用量**: 50MB以下（大規模設定ファイル時）

### 対応FortiOSバージョン

- **主要対応**: FortiOS 7.0, 7.2, 7.4, 7.6
- **基本対応**: FortiOS 6.4以降

## ファイル構成

```
fortios-vscode-extension/
├── package.json                 # 拡張機能マニフェスト
├── src/
│   ├── extension.ts            # メインエントリーポイント
│   ├── providers/
│   │   ├── DocumentSymbolProvider.ts
│   │   ├── FoldingRangeProvider.ts
│   │   ├── CompletionItemProvider.ts
│   │   └── DiagnosticProvider.ts
│   ├── parsers/
│   │   ├── FortiOSParser.ts    # 設定ファイル解析
│   │   └── ConfigAnalyzer.ts   # 設定要約分析
│   ├── data/
│   │   ├── commands.ts         # FortiOSコマンド定義
│   │   └── schemas.ts          # 設定スキーマ定義
│   └── utils/
│       ├── validators.ts       # IP/ポート検証
│       └── treeView.ts         # ツリービュー機能
├── syntaxes/
│   └── fortios.tmLanguage.json # シンタックスハイライト
├── language-configuration.json # 言語設定
└── README.md
```

## ユーザーインターフェース

### VS Code統合箇所

1. **エクスプローラーパネル**: 設定構造ツリー表示
2. **コマンドパレット**: 設定要約表示コマンド
3. **ステータスバー**: FortiOSファイル検出表示
4. **エディター**: シンタックスハイライト、補完、エラー表示
5. **サイドパネル**: 設定要約WebView

### キーボードショートカット

- `Ctrl+Shift+P` → `FortiOS: Show Configuration Summary`
- `Ctrl+/` → コメント切り替え
- `Ctrl+Space` → 強制補完実行
- `F2` → 設定要素のリネーム（将来実装）

## 品質保証

### テスト要件

- **単体テスト**: 各Providerクラスの機能テスト
- **統合テスト**: 実際のFortiOS設定ファイルでのE2Eテスト
- **パフォーマンステスト**: 大規模ファイル（1MB以上）での動作確認

### サポートファイル例

```fortios
#config-version=FG60E-7.04.0-FW-build1637
#conf_file_ver=27179869947
#buildno=1637
#global_vdom=1
config system global
    set hostname "FortiGate-Tokyo"
    set timezone "Asia/Tokyo"
end
config system interface
    edit "port1"
        set mode static
        set ip 192.168.1.1 255.255.255.0
    next
end
config firewall policy
    edit 1
        set srcintf "port2"
        set dstintf "port1"  
        set srcaddr "all"
        set dstaddr "all"
        set action accept
        set service "ALL"
    next
end
```

## 配布・デプロイ

### VS Code Marketplace

- **拡張機能名**: FortiOS Configuration Helper
- **カテゴリ**: Languages, Formatters
- **キーワード**: fortios, fortigate, firewall, network, configuration

### バージョン管理

- **MVP版**: v0.1.0
- **安定版**: v1.0.0
- **更新サイクル**: 月次リリース（機能追加）、随時（バグ修正）

## 今後の拡張予定

Tier 1実装完了後の機能拡張：

- Cisco ASA対応
- API統合（設定反映・取得）
- 設定比較・差分表示
- AI支援設定生成
- マルチベンダー対応

---

この要件定義に基づいて、堅牢で使いやすいFortiOS VS Code拡張機能を開発します。
