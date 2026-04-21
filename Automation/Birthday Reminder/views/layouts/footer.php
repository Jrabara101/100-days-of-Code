    </main><!-- /#main-content -->

  </div><!-- /.main-wrapper -->

</div><!-- /.app-wrapper -->

<!-- ════ Delete Confirmation Modal ════ -->
<div class="modal-overlay" id="deleteModal" role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle">
  <div class="modal">
    <div class="modal-header">
      <span style="font-size:24px">🗑️</span>
      <h3 id="deleteModalTitle">Confirm Delete</h3>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to delete <strong id="deleteTargetName"></strong>?
         This action cannot be undone and will also remove all associated reminder rules.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeDeleteModal()" id="cancelDeleteBtn">Cancel</button>
      <form id="deleteForm" method="POST">
        <?= csrf_input() ?>
        <input type="hidden" name="id" id="deleteTargetId">
        <button type="submit" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
      </form>
    </div>
  </div>
</div>

<!-- App JS -->
<script src="<?= BASE_URL ?>/assets/js/app.js"></script>

</body>
</html>
