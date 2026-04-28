const wearLogService = require("../../services/wearLogService.js");
const feedbackService = require("../../services/feedbackService.js");

Page({
  data: {
    loading: false,
    submitting: false,

    wearLogs: [],
    selectedWearLogId: "",
    editingWearLog: null,

    manageMode: false,
    selectedIds: [],

    feedbackForm: {
      morningFeedback: "ok",
      noonFeedback: "ok",
      eveningFeedback: "ok",
      layeringFeedback: "ok"
    }
  },

  onLoad() {
    this.loadWearLogs();
  },

  onShow() {
    this.loadWearLogs();
  },

  async loadWearLogs() {
    this.setData({
      loading: true
    });

    const wearResult = await wearLogService.listWearLogsByCurrentWardrobe();
    const feedbackResult = await feedbackService.listFeedbackLogsByCurrentWardrobe();

    const wearLogs = wearResult.data || [];
    const feedbackLogs = feedbackResult.data || [];

    const enhancedWearLogs = wearLogs.map((log) => {
      const feedback =
        feedbackLogs.find((fb) => fb.wearLogId === log._id) || null;

      return {
        ...log,
        feedback
      };
    });

    this.setData({
      loading: false,
      wearLogs: enhancedWearLogs
    });

    if (!wearResult.success) {
      wx.showToast({
        title: wearResult.errorMessage || "读取失败",
        icon: "none"
      });
    }
  },

  handleSelectWearLog(e) {
    const index = Number(e.currentTarget.dataset.index);
    const wearLog = this.data.wearLogs[index];

    if (!wearLog) return;

    if (this.data.manageMode) {
      this.toggleSelectId(wearLog._id);
      return;
    }

    this.setData({
      selectedWearLogId:
        this.data.selectedWearLogId === wearLog._id ? "" : wearLog._id,
      editingWearLog: null
    });
  },

  handleOpenFeedbackEditor(e) {
    const index = Number(e.currentTarget.dataset.index);
    const wearLog = this.data.wearLogs[index];

    if (!wearLog) return;

    const feedback = wearLog.feedback;

    this.setData({
      selectedWearLogId: wearLog._id,
      editingWearLog: wearLog,
      feedbackForm: {
        morningFeedback: feedback?.morningFeedback || "ok",
        noonFeedback: feedback?.noonFeedback || "ok",
        eveningFeedback: feedback?.eveningFeedback || "ok",
        layeringFeedback: feedback?.layeringFeedback || "ok"
      }
    });
  },

  handleCloseEditor() {
    this.setData({
      editingWearLog: null
    });
  },

  toggleManageMode() {
    this.setData({
      manageMode: !this.data.manageMode,
      selectedIds: [],
      selectedWearLogId: "",
      editingWearLog: null
    });
  },

  toggleSelectId(id) {
    const selectedIds = this.data.selectedIds;
    const exists = selectedIds.includes(id);

    this.setData({
      selectedIds: exists
        ? selectedIds.filter((item) => item !== id)
        : selectedIds.concat(id)
    });
  },

  handleSelectFeedback(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.currentTarget.dataset.value;

    if (!field || !value) return;

    this.setData({
      [`feedbackForm.${field}`]: value
    });
  },

  getSingleTemperatureAdjustment(feedback) {
    if (feedback === "cold") return -1;
    if (feedback === "hot") return 1;
    return 0;
  },

  calculateTemperatureAdjustment(form) {
    const total =
      this.getSingleTemperatureAdjustment(form.morningFeedback) +
      this.getSingleTemperatureAdjustment(form.noonFeedback) +
      this.getSingleTemperatureAdjustment(form.eveningFeedback);

    if (total <= -2) return -1;
    if (total >= 2) return 1;
    return 0;
  },

  updateCurrentWearLogFeedback(feedbackData) {
    const wearLogs = this.data.wearLogs.map((log) => {
      if (log._id !== feedbackData.wearLogId) {
        return log;
      }

      return {
        ...log,
        feedback: feedbackData
      };
    });

    this.setData({
      wearLogs,
      editingWearLog: null
    });
  },

  async handleSubmitFeedback() {
    const wearLog = this.data.editingWearLog;

    if (!wearLog || !wearLog._id) {
      wx.showToast({
        title: "请先选择穿搭记录",
        icon: "none"
      });
      return;
    }

    this.setData({
      submitting: true
    });

    const form = this.data.feedbackForm;

    const result = await feedbackService.upsertDailyFeedback({
      wearLogId: wearLog._id,
      targetDate: wearLog.date,
      outfitSignature: wearLog.outfitSignature || "",
      morningFeedback: form.morningFeedback,
      noonFeedback: form.noonFeedback,
      eveningFeedback: form.eveningFeedback,
      layeringFeedback: form.layeringFeedback
    });

    this.setData({
      submitting: false
    });

    if (result.success) {
      wx.showToast({
        title: result.mode === "update" ? "反馈已修改" : "反馈已保存",
        icon: "success"
      });

      const newFeedback = {
        _id: result.feedbackId || wearLog.feedback?._id || "",
        wearLogId: wearLog._id,
        targetDate: wearLog.date,
        outfitSignature: wearLog.outfitSignature || "",

        morningFeedback: form.morningFeedback,
        noonFeedback: form.noonFeedback,
        eveningFeedback: form.eveningFeedback,
        layeringFeedback: form.layeringFeedback,

        temperatureAdjustment: this.calculateTemperatureAdjustment(form)
      };

      this.updateCurrentWearLogFeedback(newFeedback);
    } else {
      wx.showToast({
        title: result.errorMessage || "保存失败",
        icon: "none"
      });
    }
  },

  async handleDateChange(e) {
    const index = Number(e.currentTarget.dataset.index);
    const date = e.detail.value;
    const wearLog = this.data.wearLogs[index];

    if (!wearLog || !wearLog._id) return;

    const result = await wearLogService.updateWearLogDate(wearLog._id, date);

    if (result.success) {
      wx.showToast({
        title: "日期已更新",
        icon: "success"
      });

      const wearLogs = this.data.wearLogs.map((log) => {
        if (log._id !== wearLog._id) return log;

        return {
          ...log,
          date
        };
      });

      this.setData({
        wearLogs
      });
    } else {
      wx.showToast({
        title: result.errorMessage || "修改失败",
        icon: "none"
      });
    }
  },

  handleBatchDelete() {
    const ids = this.data.selectedIds;

    if (ids.length === 0) {
      wx.showToast({
        title: "请先选择记录",
        icon: "none"
      });
      return;
    }

    wx.showModal({
      title: "确认删除",
      content: `确定删除选中的 ${ids.length} 条穿搭记录吗？对应反馈记录暂时不会自动删除。`,
      confirmText: "删除",
      confirmColor: "#d93025",
      success: async (res) => {
        if (!res.confirm) return;

        const result = await wearLogService.deleteWearLogs(ids);

        if (result.success) {
          wx.showToast({
            title: "已删除",
            icon: "success"
          });

          const remainLogs = this.data.wearLogs.filter((log) => {
            return !ids.includes(log._id);
          });

          this.setData({
            wearLogs: remainLogs,
            selectedIds: [],
            manageMode: false,
            selectedWearLogId: "",
            editingWearLog: null
          });
        } else {
          wx.showToast({
            title: result.errorMessage || "删除失败",
            icon: "none"
          });
        }
      }
    });
  }
});