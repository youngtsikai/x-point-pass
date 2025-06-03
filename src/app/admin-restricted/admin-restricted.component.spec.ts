import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRestrictedComponent } from './admin-restricted.component';

describe('AdminRestrictedComponent', () => {
  let component: AdminRestrictedComponent;
  let fixture: ComponentFixture<AdminRestrictedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRestrictedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminRestrictedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
