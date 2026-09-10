# diagrams

[Picketfence Labs](https://github.com/picketfence-labs) が作成した [Archify](https://github.com/tt-a1i/archify) 製ダイアグラム（自己完結インタラクティブHTML）を、リンク共有目的でホスティングするためだけのリポジトリです。

## 設計方針

- 各ダイアグラムは `<ランダムなslug>/index.html` という個別フォルダに配置し、GitHub Pages経由で `https://picketfence-labs.github.io/diagrams/<slug>/` として配信します
- フォルダ名は内容を推測できないランダム文字列にしており、**リンクを知っている人だけがそのダイアグラムにアクセスできる**ことを意図しています（診断・棚卸し目的のクロール/ブルートフォースを軽減するため`robots.txt`で全体をクロール拒否しています）
- **既知の制約**: このリポジトリ自体はpublicなので、GitHubの通常のリポジトリブラウザ（`github.com/picketfence-labs/diagrams`のファイルツリー）経由であれば、このrepoの内容を直接見ようとした人には全フォルダ名が見えてしまいます。「URLを知らない第三者が偶然一覧に辿り着く」ことは防げますが、「積極的にこのGitHubリポジトリ自体を調べに来た人」に対する強固なアクセス制御ではありません
- 各ダイアグラムのソース（JSON IR）やスクリーンショット(PNG)はここには置かず、[Picketfence Labsの個人Vault](https://github.com/picketfence-labs/obsidian-vault-labs)（private）側で管理します。ここには配信用の生成HTMLのみを置きます

## 一覧

一覧は [index.html](https://picketfence-labs.github.io/diagrams/)（このリポジトリのPagesルート）を参照してください。
