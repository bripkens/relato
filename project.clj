(defproject relato "0.1.0"
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [org.clojure/clojurescript "0.0-2138"]
                 [om "0.1.7"]]
  :plugins [[lein-cljsbuild "1.0.1"]]
  :jvm-opts ^:replace ["-Xmx512m" "-server"]
  :cljsbuild {
    :builds [{:id "dev"
              :source-paths ["cljs"]
              :compiler {:output-to "app.js"
                         :optimizations :whitespace
                         :pretty-print true}}
             {:id "release"
              :source-paths ["cljs"]
              :compiler {:output-to "app.js"
                         :optimizations :advanced
                         :pretty-print false
                         :preamble ["vendor/react/react.min.js"]
                         :externs ["react.js"]
                         :closure-warnings
                         {:non-standard-jsdoc :off}}}]})
