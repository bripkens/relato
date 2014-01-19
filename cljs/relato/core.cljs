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

(def items-per-page 10)

(def app-state (atom {:npm-projects []
                      :page 0
                      :sort {:property "pageRank"
                             :ascending false}}))

(defn npm-data-row [data owner]
  (om/component
    (dom/tr nil
      (dom/td nil (get data "name"))
      (dom/td nil (+ (get data "runtimeUsers") (get data "developmentUsers")))
      (dom/td nil (get data "runtimeUsers"))
      (dom/td nil (get data "developmentUsers"))
      (dom/td nil (get data "pageRank")))))

(defn get-visible-datasets [items page]
  (if (empty? items)
    items
    (subvec items
            (* page items-per-page)
            (min (count items) (+ (* page items-per-page) items-per-page)))))

(defn get-sorted-projects [sort-config projects]
  (let [property (:property sort-config)
        ascending (:ascending sort-config)
        sorted (js/getProjectDataSortedBy property ascending)]
      [sorted]))

(defn npm-data-table [data owner]
  (om/component
    (dom/table nil
      (dom/thead nil
        (dom/tr nil
          (dom/th #js {:onClick (fn []
                                  (om/transact!
                                    data
                                    [:sort :predicate]
                                    (fn [_]
                                      :name))
                                  (om/transact!
                                    data
                                    :npm-projects
                                    (fn [_]
                                      (into []
                                            (get-sorted-projects (assoc (:sort data) :predicate :name)
                                                                 (:npm-projects data))))))}
                  "Name")
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
        (dom/li nil
          (dom/a #js {:dangerouslySetInnerHTML #js {:__html "&laquo;"}
                      :onClick #(when (>= (dec page) 0)
                                  (om/transact! data :page dec))}
                 nil))
        (dom/li nil
          (dom/span nil (str "Page " (+ 1 page) " / " page-count)))
        (dom/li nil
          (dom/a #js {:dangerouslySetInnerHTML #js {:__html "&raquo;"}
                      :onClick #(if (< (inc page) page-count)
                                  (om/transact! data :page inc))}
                 nil))))))

(defn Relato [app owner]
  (reify
    om/IDidMount
    (did-mount [_ _]
      (xhr/send "stats.csv"
                (fn [event]
                  (let [text (-> event
                                 .-target
                                 .getResponseText)
                        data (js/loadProjectData text)]
                      (om/transact!
                         app
                         :npm-projects
                         (fn [_]
                           (into []
                                 (get-sorted-projects (:sort app)
                                                      data))))))))
    om/IRender
    (render [_]
      (if (empty? (:npm-projects app))
        (dom/div nil "Please wait a second")
        (dom/div nil
          (om/build npm-data-table app)
          (om/build pagination app))))))

(set! *print-fn* #(.log js/console %))

(om/root app-state
         Relato
         (.getElementById js/document "npm-data"))

