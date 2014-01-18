(ns relato.core
  (:require [om.core :as om :include-macros true]
            [om.dom :as dom :include-macros true]
            [goog.net.XhrIo :as xhr]))

(defn parse-number [s]
  (js/parseFloat s))


(defn convert-csv [s]
  (let [datasets (map #(.split % ",")
                      (->> (.split s "\n") rest (filter #(not (empty? %)))))]
    (map #(identity {:name (first %)
                     :runtime-users (parse-number (second %))
                     :development-users (parse-number (nth % 2))
                     :page-rank (parse-number (last %))}) datasets)))

(def items-per-page 50)

(def app-state (atom {:npm-projects [{:name "foo"}]
                      :page 0
                      :sort {:predicate :page-rank
                             :order :desc}}))

(defn npm-data-row [data owner]
  (om/component
    (dom/tr nil
      (dom/td nil (:name data))
      (dom/td nil (+ (:runtime-users data) (:development-users data)))
      (dom/td nil (:runtime-users data))
      (dom/td nil (:development-users data))
      (dom/td nil (:page-rank data)))))

(defn get-visible-datasets [items page]
  (if (empty? items)
    items
    (subvec items
            (* page items-per-page)
            (min (count items) (+ (* page items-per-page) items-per-page)))))

(defn npm-data-table [data owner]
  (om/component
    (dom/table nil
      (dom/thead nil
        (dom/tr nil
          (dom/th nil "Name")
          (dom/th nil "# Users")
          (dom/th nil "# Runtime Users")
          (dom/th nil "# Development Users")
          (dom/th nil "Page Rank")))
      (dom/tbody nil
        (om/build-all npm-data-row
                      (get-visible-datasets (:npm-projects data)
                                            (:page data)))))))

(defn pagination [data owner]
  (om/component
    (let [page-count (.ceil js/Math (/ (count (:npm-projects data))
                                       items-per-page))
          page (:page data)]
      (dom/ul #js {:className "pagination"}
        ; TODO deactivate button when on first page
        (dom/li nil
          (dom/a #js {:dangerouslySetInnerHTML #js {:__html "&laquo;"}
                      :onClick #(om/transact! data :page dec)}
                 nil))
        (dom/li nil
          (dom/span nil (str "Page " (+ 1 page) " / " page-count)))
        (dom/li nil
          ; TODO deactivate button when on last page
          (dom/a #js {:dangerouslySetInnerHTML #js {:__html "&raquo;"}
                      :onClick #(om/transact! data :page inc)}
                 nil))))))

(om/root app-state
         (fn [app owner]
           (reify
             om/IDidMount
             (did-mount [_ _]
               (xhr/send "stats.csv"
                         (fn [event]
                           (let [data (-> event
                                          .-target
                                          .getResponseText
                                          convert-csv)]
                             (om/transact! app
                                           :npm-projects
                                           (fn [_] (into [] data)))))))
             om/IRender
             (render [_]
               (dom/div nil
                 (om/build npm-data-table app)
                 (om/build pagination app)))))
         (.getElementById js/document "npm-data"))





